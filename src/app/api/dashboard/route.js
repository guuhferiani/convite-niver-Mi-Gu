import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export function calculateProvisions(adultos, criancas) {
  const totalPessoas = adultos + criancas;
  if (totalPessoas === 0) {
    return {
      carneTotalKg: 0,
      carneBovinaKg: 0,
      linguicaKg: 0,
      frangoKg: 0,
      paoDeAlhoUnidades: 0,
      queijoCoalhoEspetos: 0,
      arrozKg: 0,
      farofaKg: 0,
      vinagreteKg: 0,
      carvaoSacos: 0,
      geloSacos: 0,
      refrigeranteLitros: 0,
      aguaLitros: 0,
      pratosDescartaveis: 0,
      coposDescartaveis: 0,
      talheresKits: 0,
      guardanaposPacotes: 0,
    };
  }

  // 400g por adulto, 200g por criança
  const carneTotalKg = ((adultos * 0.40) + (criancas * 0.20)).toFixed(1);
  const carneBovinaKg = (parseFloat(carneTotalKg) * 0.50).toFixed(1);
  const linguicaKg = (parseFloat(carneTotalKg) * 0.25).toFixed(1);
  const frangoKg = (parseFloat(carneTotalKg) * 0.25).toFixed(1);

  const paoDeAlhoUnidades = Math.ceil(adultos * 2 + criancas * 1);
  const queijoCoalhoEspetos = Math.ceil(adultos * 1 + criancas * 0.5);
  const arrozKg = Math.max(1, Math.ceil(totalPessoas * 0.08));
  const farofaKg = (totalPessoas * 0.05).toFixed(1);
  const vinagreteKg = (totalPessoas * 0.06).toFixed(1);

  // 1 saco de 10kg de carvão para cada ~10kg de carne
  const carvaoSacos = Math.max(1, Math.ceil(parseFloat(carneTotalKg) / 10));
  const geloSacos = Math.max(1, Math.ceil(totalPessoas / 3)); // sacos de 5kg

  // Bebidas não alcoólicas
  const refrigeranteLitros = Math.ceil(totalPessoas * 0.6);
  const aguaLitros = Math.ceil(totalPessoas * 0.4);

  // Descartáveis
  const pratosDescartaveis = Math.ceil(totalPessoas * 2.5);
  const coposDescartaveis = Math.ceil(totalPessoas * 4);
  const talheresKits = Math.ceil(totalPessoas * 2);
  const guardanaposPacotes = Math.max(1, Math.ceil(totalPessoas / 12));

  return {
    carneTotalKg: parseFloat(carneTotalKg),
    carneBovinaKg: parseFloat(carneBovinaKg),
    linguicaKg: parseFloat(linguicaKg),
    frangoKg: parseFloat(frangoKg),
    paoDeAlhoUnidades,
    queijoCoalhoEspetos,
    arrozKg,
    farofaKg: parseFloat(farofaKg),
    vinagreteKg: parseFloat(vinagreteKg),
    carvaoSacos,
    geloSacos,
    refrigeranteLitros,
    aguaLitros,
    pratosDescartaveis,
    coposDescartaveis,
    talheresKits,
    guardanaposPacotes,
  };
}

export async function GET() {
  try {
    const convidados = await sql`
      SELECT id, list_index, nome, status, adultos_qtd, criancas_qtd, acompanhantes_nomes, telefone, mensagem, restricao_alimentar, confirmado_em, created_at
      FROM convidados
      ORDER BY 
        CASE 
          WHEN status = 'confirmado' THEN 1
          WHEN status = 'pendente' THEN 2
          ELSE 3
        END,
        list_index ASC
    `;

    const totalLista = convidados.length;
    let confirmadosCount = 0;
    let recusadosCount = 0;
    let pendentesCount = 0;
    let totalAdultos = 0;
    let totalCriancas = 0;

    convidados.forEach((c) => {
      if (c.status === 'confirmado') {
        confirmadosCount++;
        totalAdultos += parseInt(c.adultos_qtd, 10) || 1;
        totalCriancas += parseInt(c.criancas_qtd, 10) || 0;
      } else if (c.status === 'recusado') {
        recusadosCount++;
      } else {
        pendentesCount++;
      }
    });

    const totalPessoasConfirmadas = totalAdultos + totalCriancas;
    const calculoComida = calculateProvisions(totalAdultos, totalCriancas);

    // Estimativa com 80% dos pendentes
    const estimativaAdultosPotencial = totalAdultos + Math.round(pendentesCount * 0.8);
    const calculoComidaPotencial = calculateProvisions(estimativaAdultosPotencial, totalCriancas);

    const mensagens = convidados
      .filter((c) => c.mensagem && c.mensagem.trim().length > 0)
      .map((c) => ({
        id: c.id,
        nome: c.nome,
        mensagem: c.mensagem,
        confirmado_em: c.confirmado_em,
        status: c.status
      }));

    return new NextResponse(
      JSON.stringify({
        success: true,
        stats: {
          totalLista,
          confirmadosCount,
          recusadosCount,
          pendentesCount,
          totalAdultos,
          totalCriancas,
          totalPessoasConfirmadas,
          taxaConfirmacao: totalLista > 0 ? Math.round((confirmadosCount / totalLista) * 100) : 0,
        },
        calculoComida,
        calculoComidaPotencial,
        mensagens,
        convidados
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      }
    );
  } catch (error) {
    console.error('Erro ao gerar dados do dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao obter dados do dashboard' },
      { status: 500 }
    );
  }
}
