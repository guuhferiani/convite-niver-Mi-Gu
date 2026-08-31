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
  MessageSquare,
  Lock,
  Download,
  Send,
  ArrowLeft,
  RefreshCw,
  ShoppingBag,
  Utensils
} from 'lucide-react';

export default function AdminPage() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState('');

  // Dashboard state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('todos'); // 'todos' | 'confirmado' | 'pendente' | 'recusado'
  const [searchTerm, setSearchTerm] = useState('');
  const [useProjection, setUseProjection] = useState(false); // real vs projected

  // New guest modal/form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newAdultos, setNewAdultos] = useState(1);
  const [newCriancas, setNewCriancas] = useState(0);
  const [newTelefone, setNewTelefone] = useState('');
  const [isAdding, setIsAdding] = useState(false);

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
          adultos_qtd: newAdultos,
          criancas_qtd: newCriancas,
          telefone: newTelefone,
          pin
        })
      });
      const json = await res.json();
      if (json.success) {
        setNewNome('');
        setNewTelefone('');
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
    if (!confirm(`Tem certeza que deseja remover "${nome}" da lista?`)) return;

    try {
      const res = await fetch(`/api/admin/convidados?id=${id}&pin=${pin}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        await loadDashboard();
      } else {
        alert(json.error || 'Erro ao excluir');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir convidado');
    }
  };

  // Filtered convidados list
  const filteredList = useMemo(() => {
    if (!data?.convidados) return [];
    return data.convidados.filter((c) => {
      const matchesStatus = filterStatus === 'todos' || c.status === filterStatus;
      const term = searchTerm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const nomeNorm = c.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const matchesSearch = !searchTerm.trim() || nomeNorm.includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [data, filterStatus, searchTerm]);

  // Generate WhatsApp reminder link for a pending guest
  const generateWhatsAppReminder = (convidado) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/#rsvp-section`;
    const text = encodeURIComponent(
      `Olá ${convidado.nome}! Tudo bem? 🥳\n\nEstamos organizando a lista e a quantidade de comida para o nosso aniversário (Gustavo 36 & Michele 34 no dia 06/09).\n\nVocê consegue confirmar sua presença neste link?\n👉 ${link}\n\nEsperamos você lá!`
    );
    const phone = convidado.telefone ? convidado.telefone.replace(/\D/g, '') : '';
    if (phone) {
      return `https://wa.me/55${phone}?text=${text}`;
    }
    return `https://api.whatsapp.com/send?text=${text}`;
  };

  // Export to CSV
  const exportCsv = () => {
    if (!data?.convidados) return;
    const headers = [
      '# Lista',
      'Nome',
      'Status',
      'Adultos',
      'Criancas',
      'Total Pessoas',
      'Acompanhantes',
      'Telefone',
      'Restricao Alimentar',
      'Mensagem',
      'Confirmado Em'
    ];

    const rows = data.convidados.map((c) => [
      c.list_index,
      `"${c.nome}"`,
      c.status,
      c.status === 'confirmado' ? c.adultos_qtd : 0,
      c.status === 'confirmado' ? c.criancas_qtd : 0,
      c.status === 'confirmado' ? (c.adultos_qtd || 1) + (c.criancas_qtd || 0) : 0,
      `"${c.acompanhantes_nomes || ''}"`,
      `"${c.telefone || ''}"`,
      `"${c.restricao_alimentar || ''}"`,
      `"${(c.mensagem || '').replace(/"/g, '""')}"`,
      c.confirmado_em ? new Date(c.confirmado_em).toLocaleString('pt-BR') : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `convidados_aniversario_gustavo_michele_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Food calculator active choice
  const activeCalc = useProjection ? data?.calculoComidaPotencial : data?.calculoComida;

  // PIN Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel-glow p-8 rounded-3xl text-center border border-white/20">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center mx-auto mb-4 shadow-glow-white">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 font-display">
            Painel dos Aniversariantes
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mb-6">
            Área exclusiva para Gustavo e Michele gerenciarem confirmações e compras de comida.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Digite o PIN de acesso"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full text-center tracking-widest text-lg font-bold glass-input py-3 rounded-xl text-white placeholder-zinc-500"
                autoFocus
              />
              {pinError && <p className="text-rose-400 text-xs mt-2">{pinError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm shadow-glow-white transition-all"
            >
              Acessar Painel 🚀
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para a página inicial</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-6 sm:pt-10 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white font-medium mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ver Página do Convite (RSVP)</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Painel de Gestão & Compras 🥩📊
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm">
            Aniversário Gustavo 36 & Michele 34 • 06/09/2026 às 13h30
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            onClick={exportCsv}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Exportar CSV"
          >
            <Download className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-extrabold flex items-center gap-1.5 shadow-glow-white transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Convidado</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {/* Total Confirmados */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-emerald-500/30">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Total Confirmados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {data?.stats?.totalPessoasConfirmadas || 0}
            <span className="text-xs font-normal text-zinc-400 ml-2">pessoas</span>
          </div>
          <div className="text-[11px] text-emerald-300 mt-1 flex items-center gap-2">
            <span>{data?.stats?.totalAdultos || 0} adultos</span>
            {data?.stats?.totalCriancas > 0 && <span>• {data?.stats?.totalCriancas} crianças</span>}
          </div>
        </div>

        {/* Pendentes */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/15">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Ainda Pendentes</span>
            <Clock className="w-4 h-4 text-zinc-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {data?.stats?.pendentesCount || 0}
            <span className="text-xs font-normal text-zinc-400 ml-2">convites</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Aguardando resposta</div>
        </div>

        {/* Recusados */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-rose-500/30">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Não Comparecerão</span>
            <XCircle className="w-4 h-4 text-rose-400" />
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
            <span>Lista Total</span>
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {data?.stats?.totalLista || 0}
            <span className="text-xs font-normal text-zinc-400 ml-2">convidados</span>
          </div>
          <div className="text-[11px] text-zinc-300 mt-1">
            {data?.stats?.taxaConfirmacao || 0}% de adesão atual
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
                Estimativa Exata de Comida e Itens
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
                * Cálculo padrão: 400g/adulto e 200g/criança
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
                * Quantidades equilibradas para o evento
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
                    <span>• Gelo (refrigerar coolers):</span>
                    <span className="font-bold text-white">
                      {activeCalc?.geloSacos || 0} sacos (5kg)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>• Pratos / Copos / Talheres:</span>
                    <span className="font-bold text-white">
                      {activeCalc?.pratosDescartaveis || 0} pratos • {activeCalc?.coposDescartaveis || 0}{' '}
                      copos
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-zinc-400 italic">
                * Lembrete: Bebidas alcoólicas são trazidas pelos convidados
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GUEST LIST MANAGEMENT TABLE */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-display">
              <Users className="w-5 h-5 text-white" />
              <span>Lista de Convidados ({filteredList.length})</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Mantendo todas as 57 entradas originais individualmente
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
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
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Adultos</th>
                <th className="py-3.5 px-4">Crianças</th>
                <th className="py-3.5 px-4">Acompanhantes</th>
                <th className="py-3.5 px-4">Contato / Mensagem</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredList.length > 0 ? (
                filteredList.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono text-zinc-500">#{c.list_index}</td>
                    <td className="py-3 px-4 font-bold text-white">{c.nome}</td>
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
                    <td className="py-3 px-4 font-medium text-white">
                      {c.status === 'confirmado' ? c.adultos_qtd : '-'}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">
                      {c.status === 'confirmado' ? c.criancas_qtd : '-'}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-zinc-400">
                      {c.acompanhantes_nomes || '-'}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      {c.telefone && (
                        <div className="text-[11px] text-zinc-300 font-mono">{c.telefone}</div>
                      )}
                      {c.mensagem && (
                        <div className="text-[11px] text-zinc-200 italic truncate" title={c.mensagem}>
                          "{c.mensagem}"
                        </div>
                      )}
                      {c.restricao_alimentar && (
                        <div className="text-[10px] text-zinc-400">
                          ⚠️ {c.restricao_alimentar}
                        </div>
                      )}
                    </td>
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
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-400 text-xs">
                    Nenhum convidado encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MESSAGES WALL */}
      {data?.mensagens && data.mensagens.length > 0 && (
        <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10">
          <div className="flex items-center gap-2 text-white font-bold text-base mb-4 font-display">
            <MessageSquare className="w-5 h-5 text-zinc-300" />
            <span>Mural de Recados & Felicitações ({data.mensagens.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.mensagens.map((m) => (
              <div
                key={m.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between"
              >
                <p className="text-zinc-200 text-xs sm:text-sm italic leading-relaxed mb-3">
                  "{m.mensagem}"
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                  <span className="font-bold text-white">{m.nome}</span>
                  <span className="text-zinc-500">
                    {m.confirmado_em
                      ? new Date(m.confirmado_em).toLocaleDateString('pt-BR')
                      : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal: Adicionar Convidado */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel-glow rounded-3xl p-6 border border-white/30 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white font-display">
                Adicionar Convidado Extra
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleAddGuest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Qtd Adultos
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newAdultos}
                    onChange={(e) => setNewAdultos(parseInt(e.target.value, 10) || 1)}
                    className="w-full glass-input px-3.5 py-2 rounded-xl text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Qtd Crianças
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newCriancas}
                    onChange={(e) => setNewCriancas(parseInt(e.target.value, 10) || 0)}
                    className="w-full glass-input px-3.5 py-2 rounded-xl text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  WhatsApp (opcional)
                </label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={newTelefone}
                  onChange={(e) => setNewTelefone(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-zinc-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-extrabold shadow-glow-white"
                >
                  {isAdding ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
