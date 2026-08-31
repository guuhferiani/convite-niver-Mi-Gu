'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Search,
  Plus,
  Trash2,
  Lock,
  FileText,
  Send,
  ArrowLeft,
  RefreshCw,
  ShoppingBag,
  Utensils,
  Baby,
  User,
  ShieldCheck
} from 'lucide-react';

export default function AdminPage() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState('');

  // Dashboard state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('todos'); // 'todos' | 'confirmado' | 'pendente' | 'recusado' | 'crianca' | 'adulto'
  const [searchTerm, setSearchTerm] = useState('');
  const [useProjection, setUseProjection] = useState(false); // real vs projected

  // New guest modal/form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newIsCrianca, setNewIsCrianca] = useState(false);
  const [newTelefone, setNewTelefone] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Check saved session in sessionStorage
  useEffect(() => {
    const savedPin = sessionStorage.getItem('admin_pin');
    if (savedPin) {
      setPin(savedPin);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === '3634' || pin === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_pin', pin);
      setPinError('');
    } else {
      setPinError('PIN incorreto. Dica: idade do Gustavo + Michele (3634)');
    }
  };

  // Fetch dashboard data
  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboard();
    }
  }, [isAuthenticated]);

  // Toggle Guest Type between Adulto and Crianca
  const handleToggleGuestType = async (convidado) => {
    const currentIsCrianca = convidado.criancas_qtd > 0 && convidado.adultos_qtd === 0;
    const nextIsCrianca = !currentIsCrianca;

    setTogglingId(convidado.id);

    // Optimistic UI update
    setData((prev) => {
      if (!prev) return prev;
      const updatedConvidados = prev.convidados.map((c) => {
        if (c.id === convidado.id) {
          return {
            ...c,
            adultos_qtd: nextIsCrianca ? 0 : 1,
            criancas_qtd: nextIsCrianca ? 1 : 0
          };
        }
        return c;
      });

      return {
        ...prev,
        convidados: updatedConvidados
      };
    });

    try {
      const res = await fetch('/api/admin/convidados', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: convidado.id,
          is_crianca: nextIsCrianca,
          pin
        })
      });

      const json = await res.json();
      if (!json.success) {
        alert(json.error || 'Erro ao alterar tipo do convidado');
        await loadDashboard();
      } else {
        await loadDashboard();
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao alterar tipo');
      await loadDashboard();
    } finally {
      setTogglingId(null);
    }
  };

  // Add new guest
  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!newNome.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch('/api/admin/convidados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newNome,
          is_crianca: newIsCrianca,
          telefone: newTelefone,
          pin
        })
      });
      const json = await res.json();
      if (json.success) {
        setNewNome('');
        setNewTelefone('');
        setNewIsCrianca(false);
        setShowAddModal(false);
        await loadDashboard();
      } else {
        alert(json.error || 'Erro ao adicionar convidado');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao adicionar convidado');
    } finally {
      setIsAdding(false);
    }
  };

  // Delete guest
  const handleDeleteGuest = async (id, nome) => {
    if (!confirm(`Tem certeza que deseja remover ${nome} da lista de convidados?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/convidados?id=${id}&pin=${pin}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        await loadDashboard();
      } else {
        alert(json.error || 'Erro ao remover');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao conectar para remover');
    }
  };

  // 1. Export PDF for Building Reception (ONLY CONFIRMED GUESTS, ALPHABETICAL)
  const handleExportPortariaPDF = () => {
    if (!data || !data.convidados) return;

    const confirmados = data.convidados
      .filter((c) => c.status === 'confirmado')
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    if (confirmados.length === 0) {
      alert('Ainda não há nenhum convidado com presença confirmada para gerar a lista da portaria.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups no navegador para gerar o PDF da portaria.');
      return;
    }

    const stats = data.stats || {};
    const rows = confirmados
      .map((c, index) => {
        const isCrianca = c.criancas_qtd > 0 && c.adultos_qtd === 0;
        const tipoLabel = isCrianca ? 'Criança' : 'Adulto';

        return `
          <tr>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; text-align: center; width: 40px;">${index + 1}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-size: 13px;">${c.nome}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 11px;">${tipoLabel}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; width: 140px; color: #9ca3af; font-size: 10px;">_____________________</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; width: 120px; color: #9ca3af; font-size: 10px;">[ &nbsp; ] Entrada: ___:___</td>
          </tr>
        `;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Lista de Acesso Portaria — Aniversário Gustavo & Michele</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 15px; font-size: 12px; }
          .header { border-bottom: 2px solid #111827; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 18px; font-weight: 800; margin: 0; color: #000; }
          .subtitle { font-size: 11px; color: #4b5563; margin-top: 3px; }
          .info-banner { background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
          .info-item { font-size: 11px; }
          .info-item strong { color: #000; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; text-align: left; font-size: 11px; margin-top: 6px; }
          th { background: #f3f4f6; padding: 8px 10px; font-size: 10px; text-transform: uppercase; font-weight: 800; color: #374151; border-bottom: 2px solid #9ca3af; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #4b5563; border-top: 1px solid #d1d5db; padding-top: 15px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">📋 LISTA DE ACESSO PARA PORTARIA / RECEPÇÃO</h1>
            <div class="subtitle">Evento: Comemoração de Aniversário no Salão de Festas • Rua Cajuru 89, Belenzinho</div>
          </div>
          <div style="text-align: right; font-size: 10px; color: #6b7280;">
            <div>Data do Evento: <strong>06/09/2026 (Domingo)</strong></div>
            <div>Horário: <strong>A partir das 13h30</strong></div>
          </div>
        </div>

        <div class="info-banner">
          <div class="info-item">
            Anfitriões: <strong>Gustavo & Michele</strong>
          </div>
          <div class="info-item">
            Total Autorizados: <strong>${confirmados.length} Pessoas</strong> (${stats.totalAdultos || 0} Adultos • ${stats.totalCriancas || 0} Crianças)
          </div>
          <div class="info-item" style="color: #059669; font-weight: bold;">
            ✓ Apenas Convidados Confirmados
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center;">Nº</th>
              <th>Nome Completo do Convidado</th>
              <th style="text-align: center;">Tipo</th>
              <th>Documento (RG / CPF)</th>
              <th>Controle de Entrada</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="footer">
          <div>
            Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
          </div>
          <div>
            Visto da Portaria: _____________________________________
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // 2. Export PDF Complete Report (All Guests + BBQ Provisions)
  const handleExportRelatorioPDF = () => {
    if (!data || !data.convidados) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups no navegador para gerar o PDF.');
      return;
    }

    const calc = activeCalc || {};
    const stats = data.stats || {};
    const rows = data.convidados
      .map((c) => {
        const isCrianca = c.criancas_qtd > 0 && c.adultos_qtd === 0;
        const tipoLabel = isCrianca ? 'Criança' : 'Adulto';
        const statusClass =
          c.status === 'confirmado'
            ? 'color: #059669; font-weight: bold;'
            : c.status === 'recusado'
            ? 'color: #dc2626;'
            : 'color: #6b7280;';
        const statusText =
          c.status === 'confirmado' ? 'Confirmado' : c.status === 'recusado' ? 'Não irá' : 'Pendente';
        const dataConf = c.confirmado_em
          ? new Date(c.confirmado_em).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '—';

        return `
          <tr>
            <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-family: monospace;">#${c.list_index}</td>
            <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${c.nome}</td>
            <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb;">${tipoLabel}</td>
            <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb; ${statusClass}">${statusText}</td>
            <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 11px;">${dataConf}</td>
          </tr>
        `;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Convidados & Compras — Gustavo (36) & Michele (34)</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 15px; font-size: 12px; }
          .header { border-bottom: 2px solid #111827; padding-bottom: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 18px; font-weight: 800; margin: 0; color: #000; }
          .subtitle { font-size: 11px; color: #4b5563; margin-top: 3px; }
          .badge-box { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
          .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
          .card-title { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #6b7280; margin-bottom: 2px; }
          .card-value { font-size: 16px; font-weight: 800; color: #111827; }
          .card-sub { font-size: 10px; color: #6b7280; margin-top: 2px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
          .section-title { font-size: 13px; font-weight: 700; margin: 0 0 8px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
          .list-item { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; text-align: left; font-size: 11px; margin-top: 8px; }
          th { background: #f3f4f6; padding: 7px 10px; font-size: 10px; text-transform: uppercase; font-weight: 700; color: #4b5563; border-bottom: 1px solid #d1d5db; }
          .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">🎉 Aniversário Gustavo (36) & Michele (34)</h1>
            <div class="subtitle">Domingo, 06/09/2026 às 13h30 • Salão de Festas, Rua Cajuru 89, Belenzinho</div>
          </div>
          <div style="text-align: right; font-size: 10px; color: #6b7280;">
            <div>Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</div>
            <div style="font-weight: bold; color: #111827;">Relatório Oficial de Gestão</div>
          </div>
        </div>

        <div class="badge-box">
          <div class="card" style="border-left: 3px solid #059669;">
            <div class="card-title">Confirmados</div>
            <div class="card-value">${stats.totalPessoasConfirmadas || 0} pessoas</div>
            <div class="card-sub">${stats.totalAdultos || 0} adultos • ${stats.totalCriancas || 0} crianças</div>
          </div>
          <div class="card">
            <div class="card-title">Pendentes</div>
            <div class="card-value">${stats.pendentesCount || 0}</div>
            <div class="card-sub">Aguardando resposta</div>
          </div>
          <div class="card" style="border-left: 3px solid #dc2626;">
            <div class="card-title">Não Irão</div>
            <div class="card-value">${stats.recusadosCount || 0}</div>
            <div class="card-sub">Avisaram</div>
          </div>
          <div class="card">
            <div class="card-title">Lista Total</div>
            <div class="card-value">${stats.totalLista || 0} convidados</div>
            <div class="card-sub">${stats.taxaConfirmacao || 0}% de adesão</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <h3 class="section-title">🥩 Carnes & Churrasco (${useProjection ? 'Projeção com 80% Pendentes' : 'Apenas Confirmados'})</h3>
            <div class="list-item" style="font-weight: bold; border-bottom: 1px dashed #d1d5db; padding-bottom: 4px; margin-bottom: 4px;">
              <span>Total Geral de Carne:</span>
              <span>${calc.carneTotalKg || 0} kg</span>
            </div>
            <div class="list-item"><span>• Bovina (Picanha / Alcatra / Fraldinha):</span><span>${calc.carneBovinaKg || 0} kg</span></div>
            <div class="list-item"><span>• Linguiça toscana / artesanal:</span><span>${calc.linguicaKg || 0} kg</span></div>
            <div class="list-item"><span>• Frango (coxinha / tulipa):</span><span>${calc.frangoKg || 0} kg</span></div>
            <div class="list-item"><span>• Pão de Alho:</span><span>${calc.paoDeAlhoUnidades || 0} un.</span></div>
            <div class="list-item"><span>• Queijo Coalho:</span><span>${calc.queijoCoalhoEspetos || 0} espetos</span></div>
          </div>

          <div class="card">
            <h3 class="section-title">🛒 Bebidas, Insumos & Descartáveis</h3>
            <div class="list-item"><span>• Refrigerantes / Sucos:</span><span>${calc.refrigeranteLitros || 0} L</span></div>
            <div class="list-item"><span>• Água mineral:</span><span>${calc.aguaLitros || 0} L</span></div>
            <div class="list-item"><span>• Carvão (sacos 10kg):</span><span>${calc.carvaoSacos || 0} sacos</span></div>
            <div class="list-item"><span>• Gelo (sacos 5kg):</span><span>${calc.geloSacos || 0} sacos</span></div>
            <div class="list-item"><span>• Arroz (cru):</span><span>${calc.arrozKg || 0} kg</span></div>
            <div class="list-item"><span>• Farofa / Vinagrete:</span><span>${calc.farofaKg || 0} kg / ${calc.vinagreteKg || 0} kg</span></div>
          </div>
        </div>

        <h3 class="section-title">📋 Lista de Convidados (${data.convidados.length})</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 35px;">#</th>
              <th>Nome do Convidado</th>
              <th style="width: 80px;">Tipo</th>
              <th style="width: 100px;">Status</th>
              <th style="width: 120px;">Confirmado em</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="footer">
          Relatório gerado automaticamente pelo Sistema de Gestão de Convites • Aniversário Gustavo & Michele
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Generate WhatsApp reminder link
  const generateWhatsAppReminder = (convidado) => {
    const text = encodeURIComponent(
      `Olá, ${convidado.nome}! 🎉\n\nEstamos organizando o churrasco de aniversário do Gustavo (36) e da Michele (34) no dia 06/09 às 13h30!\n\nPoderia confirmar sua presença no link oficial abaixo?\nhttps://convite-niver-mi-gu.vercel.app\n\nValeu!`
    );
    return `https://wa.me/?text=${text}`;
  };

  // Filter list
  const filteredList = useMemo(() => {
    if (!data || !data.convidados) return [];

    return data.convidados.filter((c) => {
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        if (!c.nome.toLowerCase().includes(term)) return false;
      }

      // Status filter
      if (filterStatus === 'confirmado') return c.status === 'confirmado';
      if (filterStatus === 'pendente') return c.status === 'pendente';
      if (filterStatus === 'recusado') return c.status === 'recusado';
      if (filterStatus === 'crianca') return c.criancas_qtd > 0 && c.adultos_qtd === 0;
      if (filterStatus === 'adulto') return !(c.criancas_qtd > 0 && c.adultos_qtd === 0);

      return true;
    });
  }, [data, filterStatus, searchTerm]);

  // Current active provision calculation
  const activeCalc = useProjection ? data?.calculoComidaPotencial : data?.calculoComida;

  // Render Login PIN Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-panel-glow rounded-3xl p-8 border border-white/20 shadow-glow-subtle text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center mx-auto mb-4 shadow-glow-white">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 font-display">Painel de Gestão</h1>
          <p className="text-zinc-400 text-xs sm:text-sm mb-6">
            Área restrita de Gustavo & Michele para controle de confirmações e cálculo de churrasco.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Digite o PIN de 4 dígitos"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={10}
                className="w-full glass-input px-4 py-3.5 rounded-2xl text-center text-xl tracking-widest text-white placeholder-zinc-500 font-mono font-bold"
                autoFocus
              />
              {pinError && <p className="text-rose-400 text-xs mt-2">{pinError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm transition-all shadow-glow-white"
            >
              Acessar Painel
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <Link
              href="/"
              className="text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para a página do convite</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20 pt-6 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all"
            title="Voltar ao Convite"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Aniversário Gustavo 36 & Michele 34
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Painel de Gestão & Compras 🥩
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-200 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          {/* Dedicated Building Portaria PDF Button */}
          <button
            onClick={handleExportPortariaPDF}
            className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-bold text-emerald-300 transition-all shadow-sm"
            title="Gerar Lista de Acesso para a Portaria do Prédio (Apenas Confirmados em Ordem Alfabética)"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Lista Portaria (PDF)</span>
          </button>

          {/* Export Complete Management PDF Button */}
          <button
            onClick={handleExportRelatorioPDF}
            className="flex items-center gap-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-all"
            title="Gerar Relatório Completo com Lista de Compras"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-300" />
            <span>Relatório Completo (PDF)</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 py-2 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs transition-all shadow-glow-white"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Convidado</span>
          </button>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Confirmados */}
        <div className="glass-panel-glow rounded-2xl p-4 sm:p-5 border border-emerald-500/30">
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span className="font-bold uppercase tracking-wider">Confirmados</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {data?.stats?.totalPessoasConfirmadas || 0}
            <span className="text-xs font-normal text-zinc-400 ml-2">pessoas</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2">
            <span>👤 {data?.stats?.totalAdultos || 0} adultos</span>
            <span>•</span>
            <span>👶 {data?.stats?.totalCriancas || 0} crianças</span>
          </div>
        </div>

        {/* Pendentes */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/20">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="font-bold uppercase tracking-wider">Pendentes</span>
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {data?.stats?.pendentesCount || 0}
            <span className="text-xs font-normal text-zinc-400 ml-2">aguardando</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Ainda não responderam</div>
        </div>

        {/* Recusados */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-rose-500/20">
          <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
            <span className="font-bold uppercase tracking-wider">Não Irão</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {data?.stats?.recusadosCount || 0}
            <span className="text-xs font-normal text-zinc-400 ml-2">respostas</span>
          </div>
          <div className="text-[11px] text-rose-300 mt-1">Avisaram com antecedência</div>
        </div>

        {/* Total da Lista */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/20">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="font-bold uppercase tracking-wider">Lista Total</span>
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {data?.stats?.totalLista || 0}
            <span className="text-xs font-normal text-zinc-400 ml-2">convidados</span>
          </div>
          <div className="text-[11px] text-zinc-300 mt-1">
            {data?.stats?.taxaConfirmacao || 0}% de adesão confirmada
          </div>
        </div>
      </div>

      {/* CALCULADORA DE CHURRASCO E PROVISÕES */}
      <section className="mb-10">
        <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-white/20 shadow-glow-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase tracking-wider mb-1">
                <Flame className="w-4 h-4 text-white" />
                <span>Calculadora Inteligente de Compras para Churrasco</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                Estimativa Dinâmica de Comida e Itens
              </h2>
            </div>

            {/* Projection toggle */}
            <div className="flex items-center gap-2 bg-dark-900/80 p-1.5 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setUseProjection(false)}
                className={`py-1.5 px-3 rounded-lg font-medium transition-all ${
                  !useProjection
                    ? 'bg-white text-black font-extrabold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Apenas Confirmados ({data?.stats?.totalPessoasConfirmadas || 0} pess.)
              </button>
              <button
                onClick={() => setUseProjection(true)}
                className={`py-1.5 px-3 rounded-lg font-medium transition-all ${
                  useProjection
                    ? 'bg-zinc-200 text-black font-extrabold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Projeção com 80% Pendentes
              </button>
            </div>
          </div>

          {/* Food Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Carnes Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-white font-bold text-sm mb-3">
                  <Flame className="w-4 h-4 text-zinc-300" />
                  <span>Carnes & Churrasco</span>
                </div>
                <div className="space-y-2.5 text-xs text-zinc-300">
                  <div className="flex justify-between items-center py-1 border-b border-white/10">
                    <span className="font-semibold text-white">Total Geral de Carne:</span>
                    <span className="text-sm font-black text-white">
                      {activeCalc?.carneTotalKg || 0} kg
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>• Bovina (Picanha / Alcatra / Fraldinha):</span>
                    <span className="font-bold text-white">{activeCalc?.carneBovinaKg || 0} kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>• Linguiça toscana / artesanal:</span>
                    <span className="font-bold text-white">{activeCalc?.linguicaKg || 0} kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>• Frango (coxinha da asa / tulipa):</span>
                    <span className="font-bold text-white">{activeCalc?.frangoKg || 0} kg</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-zinc-400 italic">
                * Cálculo dinâmico: 400g/adulto e 200g/criança
              </div>
            </div>

            {/* Acompanhamentos Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-white font-bold text-sm mb-3">
                  <Utensils className="w-4 h-4 text-zinc-300" />
                  <span>Acompanhamentos</span>
                </div>
                <div className="space-y-2.5 text-xs text-zinc-300">
                  <div className="flex justify-between items-center">
                    <span>• Pão de Alho:</span>
                    <span className="font-bold text-white">
                      {activeCalc?.paoDeAlhoUnidades || 0} unidades
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>• Queijo Coalho:</span>
                    <span className="font-bold text-white">
                      {activeCalc?.queijoCoalhoEspetos || 0} espetos
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>• Arroz (cru):</span>
                    <span className="font-bold text-white">{activeCalc?.arrozKg || 0} kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>• Farofa temperada:</span>
                    <span className="font-bold text-white">{activeCalc?.farofaKg || 0} kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>• Vinagrete:</span>
                    <span className="font-bold text-white">{activeCalc?.vinagreteKg || 0} kg</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-zinc-400 italic">
                * Quantidades equilibradas automaticamente
              </div>
            </div>

            {/* Bebidas & Estrutura */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-white font-bold text-sm mb-3">
                  <ShoppingBag className="w-4 h-4 text-zinc-300" />
                  <span>Bebidas Não Alcoólicas & Itens</span>
                </div>
                <div className="space-y-2.5 text-xs text-zinc-300">
                  <div className="flex justify-between items-center">
                    <span>• Refrigerantes / Sucos:</span>
                    <span className="font-bold text-white">
                      {activeCalc?.refrigeranteLitros || 0} L
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>• Água mineral:</span>
                    <span className="font-bold text-white">{activeCalc?.aguaLitros || 0} L</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>• Carvão:</span>
                    <span className="font-bold text-white">
                      {activeCalc?.carvaoSacos || 0} sacos (10kg)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>• Gelo (sacos 5kg):</span>
                    <span className="font-bold text-white">{activeCalc?.geloSacos || 0} sacos</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>• Pratos / Copos / Talheres:</span>
                    <span className="font-bold text-white">
                      {activeCalc?.pratosDescartaveis || 0} un.
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-zinc-400 italic">
                * Convidados trazem a própria bebida alcoólica
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GUEST LIST TABLE */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white font-display">Lista Completa de Convidados</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Clique no botão de tipo para alternar instantaneamente entre <strong>Adulto 👤</strong> e <strong>Criança 👶</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Filtrar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-xs text-white placeholder-zinc-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-dark-900/80 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setFilterStatus('todos')}
                className={`py-1.5 px-2.5 rounded-lg transition-all ${
                  filterStatus === 'todos' ? 'bg-white text-black font-extrabold' : 'text-zinc-400'
                }`}
              >
                Todos ({data?.stats?.totalLista || 0})
              </button>
              <button
                onClick={() => setFilterStatus('confirmado')}
                className={`py-1.5 px-2.5 rounded-lg transition-all ${
                  filterStatus === 'confirmado'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-zinc-400'
                }`}
              >
                Confirmados ({data?.stats?.confirmadosCount || 0})
              </button>
              <button
                onClick={() => setFilterStatus('pendente')}
                className={`py-1.5 px-2.5 rounded-lg transition-all ${
                  filterStatus === 'pendente'
                    ? 'bg-white/15 text-white font-bold border border-white/20'
                    : 'text-zinc-400'
                }`}
              >
                Pendentes ({data?.stats?.pendentesCount || 0})
              </button>
              <button
                onClick={() => setFilterStatus('recusado')}
                className={`py-1.5 px-2.5 rounded-lg transition-all ${
                  filterStatus === 'recusado'
                    ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                    : 'text-zinc-400'
                }`}
              >
                Recusados ({data?.stats?.recusadosCount || 0})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-dark-900/90 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Nome do Convidado</th>
                <th className="py-3.5 px-4">Tipo (Clique para alternar)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Confirmado em</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredList.length > 0 ? (
                filteredList.map((c) => {
                  const isCrianca = c.criancas_qtd > 0 && c.adultos_qtd === 0;
                  const isToggling = togglingId === c.id;

                  return (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono text-zinc-500">#{c.list_index}</td>
                      <td className="py-3 px-4 font-bold text-white text-sm">{c.nome}</td>
                      
                      {/* Interactive Type Toggle Column */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleGuestType(c)}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                            isCrianca
                              ? 'bg-sky-500/15 text-sky-300 border-sky-500/40 hover:bg-sky-500/25'
                              : 'bg-zinc-800 text-zinc-200 border-zinc-600 hover:bg-zinc-700'
                          }`}
                          title="Clique para alternar entre Adulto e Criança"
                        >
                          {isToggling ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : isCrianca ? (
                            <Baby className="w-3.5 h-3.5 text-sky-400" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-zinc-300" />
                          )}
                          <span>{isCrianca ? 'Criança (200g)' : 'Adulto (400g)'}</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            c.status === 'confirmado'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : c.status === 'recusado'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-white/5 text-zinc-300 border-white/15'
                          }`}
                        >
                          {c.status === 'confirmado' && <CheckCircle2 className="w-3 h-3" />}
                          {c.status === 'recusado' && <XCircle className="w-3 h-3" />}
                          {c.status === 'pendente' && <Clock className="w-3 h-3" />}
                          <span className="capitalize">{c.status}</span>
                        </span>
                      </td>

                      {/* Confirmado em */}
                      <td className="py-3 px-4 text-zinc-400 text-[11px]">
                        {c.confirmado_em
                          ? new Date(c.confirmado_em).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '—'}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {c.status === 'pendente' && (
                            <a
                              href={generateWhatsAppReminder(c)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1 text-[11px]"
                              title="Cobrar via WhatsApp"
                            >
                              <Send className="w-3 h-3" />
                              <span className="hidden sm:inline">Cobrar</span>
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteGuest(c.id, c.nome)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                            title="Remover convidado"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-400 text-xs">
                    Nenhum convidado encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ADD GUEST MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0e1017] border border-white/20 rounded-3xl p-6 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-1 font-display">Adicionar Convidado</h3>
            <p className="text-xs text-zinc-400 mb-5">
              Insira o nome para gerar o convite e incluí-lo na lista.
            </p>

            <form onSubmit={handleAddGuest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nome do Convidado *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Ferreira"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-white placeholder-zinc-500 text-sm"
                  autoFocus
                  required
                />
              </div>

              {/* Type toggle */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Tipo de Convidado (para cálculo do churrasco)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewIsCrianca(false)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      !newIsCrianca
                        ? 'bg-white text-black border-white shadow'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Adulto (400g)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewIsCrianca(true)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      newIsCrianca
                        ? 'bg-sky-500 text-white border-sky-400 shadow'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    <Baby className="w-3.5 h-3.5" />
                    <span>Criança (200g)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="py-2.5 px-5 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs shadow-glow-white disabled:opacity-50"
                >
                  {isAdding ? 'Adicionando...' : 'Adicionar Convidado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
