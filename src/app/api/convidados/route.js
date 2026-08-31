import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();

    let convidados;
    if (search) {
      const pattern = `%${search}%`;
      convidados = await sql`
        SELECT id, list_index, nome, status, adultos_qtd, criancas_qtd, acompanhantes_nomes, telefone, mensagem, restricao_alimentar, confirmado_em
        FROM convidados
        WHERE nome ILIKE ${pattern}
        ORDER BY list_index ASC
      `;
    } else {
      convidados = await sql`
        SELECT id, list_index, nome, status, adultos_qtd, criancas_qtd, acompanhantes_nomes, telefone, mensagem, restricao_alimentar, confirmado_em
        FROM convidados
        ORDER BY list_index ASC
      `;
    }

    return new NextResponse(
      JSON.stringify({ success: true, convidados }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      }
    );
  } catch (error) {
    console.error('Erro ao buscar convidados:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao consultar convidados' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      id,
      status,
      telefone = '',
      mensagem = '',
      restricao_alimentar = ''
    } = body;

    if (!id || !status || !['confirmado', 'recusado', 'pendente'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'ID do convidado e status válido são obrigatórios' },
        { status: 400 }
      );
    }

    const guestId = parseInt(id, 10);

    // Check if the guest was pre-configured as a child or adult
    const existing = await sql`SELECT adultos_qtd, criancas_qtd FROM convidados WHERE id = ${guestId}`;
    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Convidado não encontrado' },
        { status: 404 }
      );
    }

    const isCrianca = existing[0].criancas_qtd > 0 && existing[0].adultos_qtd === 0;

    let adultos = 0;
    let criancas = 0;

    if (status === 'confirmado') {
      if (isCrianca) {
        criancas = 1;
        adultos = 0;
      } else {
        adultos = 1;
        criancas = 0;
      }
    }

    const agora = new Date().toISOString();

    const result = await sql`
      UPDATE convidados
      SET 
        status = ${status},
        adultos_qtd = ${adultos},
        criancas_qtd = ${criancas},
        telefone = ${telefone ? telefone.trim() : null},
        mensagem = ${mensagem ? mensagem.trim() : null},
        restricao_alimentar = ${restricao_alimentar ? restricao_alimentar.trim() : null},
        confirmado_em = ${status === 'pendente' ? null : agora},
        updated_at = ${agora}
      WHERE id = ${guestId}
      RETURNING *
    `;

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: status === 'confirmado' ? 'Presença confirmada com sucesso!' : 'Resposta registrada.',
        convidado: result[0]
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
    console.error('Erro ao atualizar presença do convidado:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao salvar confirmação' },
      { status: 500 }
    );
  }
}
