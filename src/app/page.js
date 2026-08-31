'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  MapPin,
  Flame,
  Beer,
  CheckCircle2,
  XCircle,
  Search,
  Users,
  Baby,
  Sparkles,
  ExternalLink,
  UserCheck,
  AlertCircle,
  Share2,
  RefreshCw,
  PartyPopper,
  ArrowRight,
  HelpCircle,
  X,
  Navigation
} from 'lucide-react';

const EVENT_DATE = new Date('2026-09-06T13:30:00-03:00');
const LOCATION_NAME = 'Salão de Festas';
const LOCATION_ADDRESS = 'Rua Cajuru 89, Belenzinho, São Paulo - SP';
const GOOGLE_MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Rua+Cajuru+89+Belenzinho+Sao+Paulo';
const WAZE_URL = 'https://waze.com/ul?q=Rua+Cajuru+89+Belenzinho+Sao+Paulo';
const UBER_URL = 'https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=Rua%20Cajuru%2C%2089%20-%20Belenzinho%2C%20S%C3%A3o%20Paulo%20-%20SP';

export default function HomePage() {
  // Convidados state
  const [convidados, setConvidados] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedConvidado, setSelectedConvidado] = useState(null);
  const searchInputRef = useRef(null);

  // Form state
  const [statusChoice, setStatusChoice] = useState('confirmado'); // 'confirmado' | 'recusado'
  const [adultosQtd, setAdultosQtd] = useState(1);
  const [criancasQtd, setCriancasQtd] = useState(0);
  const [acompanhantesNomes, setAcompanhantesNomes] = useState('');
  const [telefone, setTelefone] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [restricaoAlimentar, setRestricaoAlimentar] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Countdown state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  // Fetch convidados list
  const loadConvidados = async () => {
    try {
      setLoadingList(true);
      const res = await fetch('/api/convidados');
      const data = await res.json();
      if (data.success && Array.isArray(data.convidados)) {
        setConvidados(data.convidados);
      }
    } catch (err) {
      console.error('Erro ao carregar convidados:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadConvidados();
  }, []);

  // Countdown timer logic (Correct math: days, hours 0-23, min 0-59, sec 0-59)
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = EVENT_DATE.getTime() - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Normalize string for fuzzy match (remove accents & lowercase)
  const normalizeText = (text) => {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  // Smart search filter (matches initials, substrings, words)
  const filteredConvidados = useMemo(() => {
    const term = normalizeText(searchTerm);
    if (!term) return [];

    return convidados.filter((c) => {
      const nomeNorm = normalizeText(c.nome);
      // Matches substring anywhere in name
      if (nomeNorm.includes(term)) return true;

      // Matches initials (e.g. "gf" for Gustavo Feriani)
      const initials = nomeNorm
        .split(' ')
        .map((part) => part[0])
        .join('');
      if (initials.includes(term)) return true;

      return false;
    });
  }, [searchTerm, convidados]);

  // Handle guest selection
  const handleSelectConvidado = (convidado) => {
    setSelectedConvidado(convidado);
    setSearchTerm('');
    setIsDropdownOpen(false);
    setErrorMsg('');

    // Pre-fill if already filled before
    setStatusChoice(convidado.status === 'recusado' ? 'recusado' : 'confirmado');
    setAdultosQtd(convidado.adultos_qtd || 1);
    setCriancasQtd(convidado.criancas_qtd || 0);
    setAcompanhantesNomes(convidado.acompanhantes_nomes || '');
    setTelefone(convidado.telefone || '');
    setMensagem(convidado.mensagem || '');
    setRestricaoAlimentar(convidado.restricao_alimentar || '');
  };

  // Confetti trigger in silver & white
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 130,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#f4f4f5', '#e4e4e7', '#a1a1aa', '#71717a']
      });

      setTimeout(() => {
        confetti({
          particleCount: 90,
          angle: 60,
          spread: 65,
          origin: { x: 0 },
          colors: ['#ffffff', '#e4e4e7', '#d4d4d8']
        });
        confetti({
          particleCount: 90,
          angle: 120,
          spread: 65,
          origin: { x: 1 },
          colors: ['#ffffff', '#e4e4e7', '#d4d4d8']
        });
      }, 250);
    } catch (e) {
      console.log('Confetti error:', e);
    }
  };

  // Submit RSVP
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedConvidado) {
      setErrorMsg('Por favor, selecione seu nome na lista para confirmar.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        id: selectedConvidado.id,
        status: statusChoice,
        adultos_qtd: statusChoice === 'confirmado' ? adultosQtd : 0,
        criancas_qtd: statusChoice === 'confirmado' ? criancasQtd : 0,
        acompanhantes_nomes: statusChoice === 'confirmado' ? acompanhantesNomes : '',
        telefone,
        mensagem,
        restricao_alimentar: statusChoice === 'confirmado' ? restricaoAlimentar : ''
      };

      const res = await fetch('/api/convidados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao salvar confirmação');
      }

      setSubmittedData({
        ...payload,
        nome: selectedConvidado.nome,
        confirmado_em: new Date().toISOString()
      });

      if (statusChoice === 'confirmado') {
        triggerCelebration();
      }

      // Update in local list
      setConvidados((prev) =>
        prev.map((c) => (c.id === selectedConvidado.id ? { ...c, ...payload } : c))
      );
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Ocorreu um erro ao registrar sua resposta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate Google Calendar Link
  const generateGoogleCalendarUrl = () => {
    const title = encodeURIComponent('Aniversário Gustavo 36 & Michele 34');
    const details = encodeURIComponent(
      'Comemoração de Aniversário de Gustavo (36 anos) e Michele (34 anos)!\n\nLocal: Salão de Festas - Rua Cajuru 89, Belenzinho\nObservação: Traga a sua bebida preferida!'
    );
    const location = encodeURIComponent('Rua Cajuru 89, Belenzinho, São Paulo - SP');
    const start = '20260906T163000Z'; // 13:30 BRT = 16:30 UTC
    const end = '20260906T233000Z';

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  };

  // Generate iCal (.ics) file
  const downloadIcs = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Gustavo e Michele//Aniversario//PT',
      'BEGIN:VEVENT',
      'SUMMARY:Aniversário Gustavo 36 & Michele 34',
      'DESCRIPTION:Comemoração do aniversário do Gustavo e da Michele! Traga a sua bebida.',
      'LOCATION:Rua Cajuru 89, Belenzinho, São Paulo - SP',
      'DTSTART:20260906T163000Z',
      'DTEND:20260906T233000Z',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'aniversario-gustavo-michele.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WhatsApp Share confirmation text
  const shareConfirmation = () => {
    const text = encodeURIComponent(
      `🎉 Já confirmei minha presença no aniversário do Gustavo (36) e da Michele (34) no dia 06/09 às 13h30! Bora comemorar!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Helper to highlight matching characters in name
  const renderHighlightedName = (name, search) => {
    if (!search.trim()) return name;
    const normName = normalizeText(name);
    const normSearch = normalizeText(search);
    const index = normName.indexOf(normSearch);
    if (index === -1) return name;

    const before = name.substring(0, index);
    const match = name.substring(index, index + search.length);
    const after = name.substring(index + search.length);

    return (
      <span>
        {before}
        <span className="text-white font-black underline decoration-zinc-400">{match}</span>
        {after}
      </span>
    );
  };

  return (
    <main className="min-h-screen pb-20 pt-6 sm:pt-10 px-4 sm:px-6 max-w-4xl mx-auto">
      {/* 1. HERO SECTION: PHOTO + TITLE + COUNTDOWN */}
      <section className="relative overflow-hidden rounded-3xl glass-panel border border-white/10 p-6 sm:p-10 shadow-glass text-center mb-6">
        {/* Subtle Background Glows */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-zinc-400/5 rounded-full blur-3xl pointer-events-none" />

        {/* Photo Banner with tags overlay */}
        <div className="relative mx-auto mb-8 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-white/20 group">
          <Image
            src="/G_M-133.jpg"
            alt="Gustavo e Michele"
            width={1200}
            height={800}
            priority
            className="w-full h-auto max-h-[440px] object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs sm:text-sm text-zinc-200 bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <Flame className="w-4 h-4 text-zinc-300" /> Churrasco & Comemoração
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <Beer className="w-4 h-4 text-zinc-300" /> Traga sua bebida
            </span>
          </div>
        </div>

        {/* Headings */}
        <h2 className="text-xs uppercase tracking-widest font-bold text-zinc-400 mb-2">
          BORA COMEMORAR! NOSSO ANIVERSÁRIO TÁ CHEGANDO!
        </h2>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-3 font-display">
          Gustavo <span className="platinum-gradient-text">36</span> & Michele{' '}
          <span className="platinum-gradient-text">34</span>
        </h1>
        <p className="text-zinc-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-8">
          Preparamos esse momento com muito carinho para comemorar juntos! Confirme sua presença
          abaixo para organizarmos a comida e tudo mais.
        </p>

        {/* Countdown Cards (Dias, Min, Seg) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-sm mx-auto mb-6">
          <div className="bg-dark-900/90 border border-white/15 rounded-2xl p-3 sm:p-4 text-center">
            <span className="block text-2xl sm:text-4xl font-black text-white font-display">
              {timeLeft.days}
            </span>
            <span className="text-[10px] sm:text-xs uppercase font-semibold tracking-wider text-zinc-400 mt-1 block">
              Dias
            </span>
          </div>
          <div className="bg-dark-900/90 border border-white/15 rounded-2xl p-3 sm:p-4 text-center">
            <span className="block text-2xl sm:text-4xl font-black text-white font-display">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[10px] sm:text-xs uppercase font-semibold tracking-wider text-zinc-400 mt-1 block">
              Min
            </span>
          </div>
          <div className="bg-dark-900/90 border border-white/15 rounded-2xl p-3 sm:p-4 text-center">
            <span className="block text-2xl sm:text-4xl font-black text-zinc-200 font-display">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] sm:text-xs uppercase font-semibold tracking-wider text-zinc-400 mt-1 block">
              Seg
            </span>
          </div>
        </div>

        {/* Clean Date & Time Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-zinc-200 font-semibold shadow-sm">
          <Calendar className="w-4 h-4 text-white" />
          <span>Domingo, 06/09/2026 às 13h30</span>
        </div>
      </section>

      {/* 2. EVENT DETAILS: LOCATION & DRINKS (2 COLUMNS) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Location Card */}
        <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-zinc-300 font-bold mb-2 text-xs uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-white" />
              <span>Localização do Evento</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1">{LOCATION_NAME}</h3>
            <p className="text-zinc-300 text-xs sm:text-sm mb-4 leading-relaxed">{LOCATION_ADDRESS}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-200 transition-all hover:scale-105 text-center"
            >
              <span className="text-base mb-0.5">🗺️</span>
              <span>Google Maps</span>
            </a>
            <a
              href={WAZE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-200 transition-all hover:scale-105 text-center"
            >
              <span className="text-base mb-0.5">🚗</span>
              <span>Waze</span>
            </a>
            <a
              href={UBER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-200 transition-all hover:scale-105 text-center"
            >
              <span className="text-base mb-0.5">🚕</span>
              <span>Pedir Uber</span>
            </a>
          </div>
        </div>

        {/* Drinks & Agenda Card */}
        <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-zinc-300 font-bold mb-2 text-xs uppercase tracking-wider">
              <Beer className="w-4 h-4 text-white" />
              <span>Bebidas & Agenda</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1">Traga a sua bebida!</h3>
            <p className="text-zinc-300 text-xs sm:text-sm mb-4 leading-relaxed">
              O churrasco e acompanhamentos são por nossa conta. Traga a bebida de sua preferência para
              brindar com a gente! 🍻
            </p>
          </div>

          <div className="flex gap-2 pt-3 border-t border-white/10">
            <a
              href={generateGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-200 transition-all"
            >
              <Calendar className="w-4 h-4 text-white" />
              <span>Google Agenda</span>
            </a>
            <button
              onClick={downloadIcs}
              type="button"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-200 transition-all"
            >
              <ExternalLink className="w-4 h-4 text-zinc-300" />
              <span>Baixar iCal (Apple)</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. MAIN RSVP CONFIRMATION CARD (CENTERED & PROMINENT) */}
      <section id="rsvp-section" className="relative scroll-mt-6 mb-12">
        <div className="glass-panel-glow rounded-3xl p-6 sm:p-10 border border-white/20 shadow-glow-subtle max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-white mb-3 shadow-glow-white">
              <UserCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Confirme sua Presença
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1.5">
              Digite as iniciais ou seu primeiro nome para localizar seu convite.
            </p>
          </div>

          {/* Success / Submitted Confirmation State */}
          {submittedData ? (
            <div className="animate-fade-in bg-dark-900/98 border border-white/20 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/30 text-white flex items-center justify-center mx-auto mb-4 animate-bounce">
                {submittedData.status === 'confirmado' ? (
                  <PartyPopper className="w-8 h-8 text-white" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-zinc-300" />
                )}
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">
                {submittedData.status === 'confirmado'
                  ? 'Presença Confirmada! 🎉'
                  : 'Resposta Registrada!'}
              </h3>

              <p className="text-zinc-300 text-sm mb-6 leading-relaxed">
                {submittedData.status === 'confirmado' ? (
                  <>
                    Obrigado, <strong className="text-white">{submittedData.nome}</strong>!
                    Contamos com a sua presença para comemorar os 36 anos do Gustavo e os 34 anos da
                    Michele no dia <strong>06/09/2026</strong>.
                  </>
                ) : (
                  <>
                    Sentiremos sua falta, <strong className="text-white">{submittedData.nome}</strong>!
                    Obrigado por nos avisar.
                  </>
                )}
              </p>

              {submittedData.status === 'confirmado' && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left text-xs sm:text-sm space-y-2">
                  <div className="flex justify-between text-zinc-300">
                    <span>Adultos confirmados:</span>
                    <span className="font-semibold text-white">{submittedData.adultos_qtd}</span>
                  </div>
                  {submittedData.criancas_qtd > 0 && (
                    <div className="flex justify-between text-zinc-300">
                      <span>Crianças:</span>
                      <span className="font-semibold text-white">{submittedData.criancas_qtd}</span>
                    </div>
                  )}
                  {submittedData.acompanhantes_nomes && (
                    <div className="flex justify-between text-zinc-300">
                      <span>Acompanhantes:</span>
                      <span className="font-semibold text-white">
                        {submittedData.acompanhantes_nomes}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3">
                {submittedData.status === 'confirmado' && (
                  <button
                    onClick={shareConfirmation}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm transition-all shadow-glow-white"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Compartilhar no WhatsApp</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setSubmittedData(null);
                    setSelectedConvidado(null);
                    setSearchTerm('');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 font-medium text-sm transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Confirmar para outro convidado</span>
                </button>
              </div>
            </div>
          ) : (
            /* RSVP Form with Smart Search */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SMART SEARCH SECTION */}
              <div className="relative">
                <label className="block text-xs uppercase tracking-wider font-bold text-zinc-300 mb-2">
                  1. Localize seu nome na lista
                </label>

                {selectedConvidado ? (
                  /* Selected Guest Card (Clean without avatar or # number) */
                  <div className="p-4 rounded-2xl bg-white/10 border border-white/30 flex items-center justify-between shadow-lg animate-fade-in">
                    <div>
                      <div className="font-bold text-white text-base sm:text-lg">
                        {selectedConvidado.nome}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        Status:{' '}
                        <span
                          className={`font-semibold capitalize ${
                            selectedConvidado.status === 'confirmado'
                              ? 'text-emerald-400'
                              : selectedConvidado.status === 'recusado'
                              ? 'text-rose-400'
                              : 'text-zinc-300'
                          }`}
                        >
                          {selectedConvidado.status === 'pendente'
                            ? 'Pendente de confirmação'
                            : selectedConvidado.status}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedConvidado(null);
                        setSearchTerm('');
                        setTimeout(() => searchInputRef.current?.focus(), 100);
                      }}
                      className="text-xs font-semibold text-zinc-300 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl border border-white/15 transition-all"
                    >
                      Trocar
                    </button>
                  </div>
                ) : (
                  /* Live Smart Search Box */
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Digite as iniciais ou seu nome (ex: Gu, Mi, Al, Bru...)"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="w-full glass-input pl-11 pr-11 py-3.5 rounded-2xl text-white placeholder-zinc-500 text-sm font-medium focus:ring-2 focus:ring-white/30"
                        autoComplete="off"
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            searchInputRef.current?.focus();
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Instant Suggestions Dropdown (SOLID OPAQUE NON-TRANSPARENT BACKGROUND) */}
                    {isDropdownOpen && searchTerm.trim().length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-64 overflow-y-auto rounded-2xl bg-[#0e1017] border border-white/20 shadow-2xl divide-y divide-white/10 animate-slide-up">
                        {loadingList ? (
                          <div className="p-4 text-center text-xs text-zinc-400 flex items-center justify-center gap-2 bg-[#0e1017]">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Buscando no banco de dados...</span>
                          </div>
                        ) : filteredConvidados.length > 0 ? (
                              filteredConvidados.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => handleSelectConvidado(c)}
                                  className="w-full p-4 text-left bg-[#0e1017] hover:bg-zinc-800/90 flex items-center justify-between transition-colors group cursor-pointer"
                                >
                                  <div className="text-sm font-semibold text-zinc-200 group-hover:text-white">
                                    {renderHighlightedName(c.nome, searchTerm)}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${
                                        c.status === 'confirmado'
                                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                          : c.status === 'recusado'
                                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                          : 'bg-white/5 text-zinc-400 border-white/10'
                                      }`}
                                    >
                                      {c.status === 'confirmado'
                                        ? 'Confirmado'
                                        : c.status === 'recusado'
                                        ? 'Não irá'
                                        : 'Pendente'}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                  </div>
                                </button>
                              ))
                        ) : (
                          <div className="p-5 text-center text-xs text-zinc-400 bg-[#0e1017]">
                            <p className="font-semibold text-zinc-300 mb-1">
                              Nenhum convidado encontrado com "{searchTerm}"
                            </p>
                            <p className="text-[11px] text-zinc-500">
                              Tente digitar apenas o primeiro nome ou as iniciais.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {!searchTerm && (
                      <p className="text-[11px] text-zinc-500 mt-2 px-1 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Dica: Digite as primeiras letras do seu nome para aparecer a opção.</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* STEP 2 & 3: SHOWN ONLY AFTER GUEST IS SELECTED */}
              {selectedConvidado && (
                <div className="animate-slide-up space-y-6 pt-3 border-t border-white/10">
                  {/* Step 2: Attendance Toggle */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-zinc-300 mb-2">
                      2. Você vai comemorar com a gente?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setStatusChoice('confirmado')}
                        className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          statusChoice === 'confirmado'
                            ? 'bg-white text-black font-black border-white shadow-glow-white scale-[1.02]'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        <CheckCircle2
                          className={`w-6 h-6 ${
                            statusChoice === 'confirmado' ? 'text-black' : 'text-zinc-500'
                          }`}
                        />
                        <span className="text-xs sm:text-sm font-bold">Sim, vou! 🎉</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatusChoice('recusado')}
                        className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          statusChoice === 'recusado'
                            ? 'bg-zinc-800 text-white font-black border-zinc-500 scale-[1.02]'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        <XCircle
                          className={`w-6 h-6 ${
                            statusChoice === 'recusado' ? 'text-rose-400' : 'text-zinc-500'
                          }`}
                        />
                        <span className="text-xs sm:text-sm font-bold">Não poderei ir 😢</span>
                      </button>
                    </div>
                  </div>

                  {/* Step 3: Details if Confirmed */}
                  {statusChoice === 'confirmado' && (
                    <div className="space-y-4 pt-3 border-t border-white/10 animate-fade-in">
                      {/* Adults and Kids Counter */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Adults */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-2">
                            <Users className="w-4 h-4 text-white" />
                            <span>Adultos</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-zinc-400">Total</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setAdultosQtd((prev) => Math.max(1, prev - 1))}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center text-base"
                              >
                                -
                              </button>
                              <span className="font-black text-base text-white w-6 text-center">
                                {adultosQtd}
                              </span>
                              <button
                                type="button"
                                onClick={() => setAdultosQtd((prev) => prev + 1)}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center text-base"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Children */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-2">
                            <Baby className="w-4 h-4 text-zinc-300" />
                            <span>Crianças</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-zinc-400">Até 11 anos</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setCriancasQtd((prev) => Math.max(0, prev - 1))}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center text-base"
                              >
                                -
                              </button>
                              <span className="font-black text-base text-white w-6 text-center">
                                {criancasQtd}
                              </span>
                              <button
                                type="button"
                                onClick={() => setCriancasQtd((prev) => prev + 1)}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center text-base"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Companion Names */}
                      {(adultosQtd > 1 || criancasQtd > 0) && (
                        <div className="animate-fade-in">
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            Nome dos acompanhantes (opcional)
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Esposa(o), namorada(o), filhos..."
                            value={acompanhantesNomes}
                            onChange={(e) => setAcompanhantesNomes(e.target.value)}
                            className="w-full glass-input px-4 py-2.5 rounded-xl text-white placeholder-zinc-500 text-sm"
                          />
                        </div>
                      )}

                      {/* Dietary Restrictions */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Restrição alimentar ou observação (opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Vegetariano, celíaco, intolerância, etc."
                          value={restricaoAlimentar}
                          onChange={(e) => setRestricaoAlimentar(e.target.value)}
                          className="w-full glass-input px-4 py-2.5 rounded-xl text-white placeholder-zinc-500 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      WhatsApp para contato (opcional)
                    </label>
                    <input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full glass-input px-4 py-2.5 rounded-xl text-white placeholder-zinc-500 text-sm"
                    />
                  </div>

                  {/* Loving Message */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Recado para o Gustavo e a Michele (opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Mande um recado de parabéns ou carinho..."
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      className="w-full glass-input px-4 py-2.5 rounded-xl text-white placeholder-zinc-500 text-sm resize-none"
                    />
                  </div>

                  {/* Error display */}
                  {errorMsg && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-sm sm:text-base tracking-wide shadow-glow-white transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Salvando sua confirmação...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>
                          {statusChoice === 'confirmado'
                            ? 'CONFIRMAR MINHA PRESENÇA 🍻'
                            : 'ENVIAR RESPOSTA'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-zinc-500 border-t border-white/10 pt-8 mt-16">
        <p>
          Feito por{' '}
          <a
            href="https://github.com/guuhferiani"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-300 hover:text-white font-medium transition-colors no-underline"
          >
            Gustavo
          </a>
        </p>
      </footer>
    </main>
  );
}
