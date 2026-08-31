import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { nome, is_crianca = false, telefone = '', pin } = body;

    const expectedPin = process.env.ADMIN_PIN || '3634';
    if (pin && pin !== expectedPin) {
      return NextResponse.json({ success: false, error: 'PIN de acesso inválido' }, { status: 403 });
    }

    if (!nome || !nome.trim()) {
      return NextResponse.json({ success: false, error: 'Nome do convidado é obrigatório' }, { status: 400 });
    }

    // Get max list_index
    const maxIdxRes = await sql`SELECT COALESCE(MAX(list_index), 0) as max_idx FROM convidados`;
    const nextIdx = (maxIdxRes[0]?.max_idx || 0) + 1;

    const adultos_qtd = is_crianca ? 0 : 1;
    const criancas_qtd = is_crianca ? 1 : 0;

    const result = await sql`
      INSERT INTO convidados (list_index, nome, status, adultos_qtd, criancas_qtd, telefone)
      VALUES (${nextIdx}, ${nome.trim()}, 'pendente', ${adultos_qtd}, ${criancas_qtd}, ${telefone.trim() || null})
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      message: 'Convidado adicionado com sucesso!',
      convidado: result[0]
    });
  } catch (error) {
    console.error('Erro ao adicionar convidado:', error);
    return NextResponse.json({ success: false, error: 'Erro ao adicionar convidado' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, is_crianca, pin } = body;

    const expectedPin = process.env.ADMIN_PIN || '3634';
    if (pin && pin !== expectedPin) {
      return NextResponse.json({ success: false, error: 'PIN inválido' }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório' }, { status: 400 });
    }

    const guestId = parseInt(id, 10);
    const adultos_qtd = is_crianca ? 0 : 1;
    const criancas_qtd = is_crianca ? 1 : 0;

    const result = await sql`
      UPDATE convidados
      SET 
        adultos_qtd = ${adultos_qtd},
        criancas_qtd = ${criancas_qtd},
        updated_at = NOW()
      WHERE id = ${guestId}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      message: `Convidado atualizado para ${is_crianca ? 'Criança' : 'Adulto'}`,
      convidado: result[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar tipo de convidado:', error);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar tipo' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const pin = searchParams.get('pin');

    const expectedPin = process.env.ADMIN_PIN || '3634';
    if (pin && pin !== expectedPin) {
      return NextResponse.json({ success: false, error: 'PIN inválido' }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório' }, { status: 400 });
    }

    await sql`DELETE FROM convidados WHERE id = ${parseInt(id, 10)}`;

    return NextResponse.json({ success: true, message: 'Convidado removido' });
  } catch (error) {
    console.error('Erro ao remover convidado:', error);
    return NextResponse.json({ success: false, error: 'Erro ao remover convidado' }, { status: 500 });
  }
}
