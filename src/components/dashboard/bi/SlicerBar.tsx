'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useCrossFilter } from './CrossFilterContext';
import {
  Search,
  X,
  RotateCcw,
  Filter,
  Check,
  ChevronDown,
} from 'lucide-react';
import type { TipoInstrumento, StatusInstrumento, TipoContrato } from '@/lib/types/database.types';

interface MultiSelectDropdownProps<T extends string> {
  label: string;
  selectedValues: T[];
  options: Array<{ value: T; label: string }>;
  onToggle: (value: T) => void;
  onClear: () => void;
}

function MultiSelectDropdown<T extends string>({
  label,
  selectedValues,
  options,
  onToggle,
  onClear,
}: MultiSelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const count = selectedValues.length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
          count > 0
            ? 'bg-sempi-plum/10 border-sempi-plum text-sempi-plum font-semibold'
            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
        }`}
      >
        <span>{label}</span>
        {count > 0 && (
          <span className="px-1.5 py-0.2 bg-sempi-plum text-white text-[10px] font-mono rounded-full">
            {count}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-56 p-2 bg-white rounded-xl shadow-lg border border-slate-200 z-50 text-xs space-y-1 font-sans">
          <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-slate-100 text-[11px] text-slate-500 font-mono">
            <span>{label} ({count} sel.)</span>
            {count > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="text-sempi-plum hover:underline"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {options.map((opt) => {
              const isChecked = selectedValues.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onToggle(opt.value)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors ${
                    isChecked
                      ? 'bg-sempi-plum/10 text-sempi-plum font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  <div
                    className={`w-4 h-4 rounded-xs border flex items-center justify-center transition-all ${
                      isChecked
                        ? 'bg-sempi-plum border-sempi-plum text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function SlicerBar() {
  const {
    filters,
    setFilter,
    toggleFilter,
    removeFilterItem,
    clearFilterDimension,
    clearAllFilters,
    activeFilterChips,
    activeFiltersCount,
    isAnyFilterActive,
    dataset,
  } = useCrossFilter();

  // Opções para Instrumentos
  const instrumentoOptions: Array<{ value: TipoInstrumento; label: string }> = [
    { value: 'CONTRATO_FORMAL', label: 'Contrato Formal' },
    { value: 'NOTA_EMPENHO_FORCA_CONTRATO', label: 'Art. 95 (Força de Contrato)' },
  ];

  // Opções para Status
  const statusOptions: Array<{ value: StatusInstrumento; label: string }> = [
    { value: 'VIGENTE', label: 'Vigente' },
    { value: 'SUSPENSO', label: 'Suspenso' },
    { value: 'ENCERRADO', label: 'Encerrado' },
    { value: 'EM_FORMALIZACAO', label: 'Em Formalização' },
    { value: 'RESCINDIDO', label: 'Rescindido' },
  ];

  // Opções para Tipo de Contrato
  const tipoContratoOptions: Array<{ value: TipoContrato; label: string }> = [
    { value: 'CONTINUO', label: 'Contínuo' },
    { value: 'ESCOPO', label: 'Escopo' },
  ];

  // Extrai lista única de gestores e fiscais para o slicer de servidores
  const fiscalOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of dataset.contratos) {
      if (c.fiscais_info.gestor?.nome) set.add(c.fiscais_info.gestor.nome);
      if (c.fiscais_info.fiscalTecnico?.nome) set.add(c.fiscais_info.fiscalTecnico.nome);
      for (const f of c.fiscais_info.fiscaisAdicionais) {
        if (f.nome) set.add(f.nome);
      }
    }
    return Array.from(set).sort().map((nome) => ({ value: nome, label: nome }));
  }, [dataset.contratos]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs space-y-3.5">
      {/* Linha 1: Controles de Segmentação Rápida */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Barra de Busca Omnibox */}
        <div className="relative flex-1 min-w-[260px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Filtrar por SEI, SIGA, Razão Social, CNPJ ou Nº Contrato..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sempi-plum/20 focus:border-sempi-plum transition-all font-sans"
          />
          {filters.search && (
            <button
              onClick={() => setFilter('search', '')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Grupo de Dropdowns / Segmentadores Multi-Seleção */}
        <div className="flex items-center gap-2 flex-wrap">
          <MultiSelectDropdown
            label="Instrumento"
            selectedValues={filters.tipoInstrumento}
            options={instrumentoOptions}
            onToggle={(val) => toggleFilter('tipoInstrumento', val)}
            onClear={() => clearFilterDimension('tipoInstrumento')}
          />

          <MultiSelectDropdown
            label="Status"
            selectedValues={filters.status}
            options={statusOptions}
            onToggle={(val) => toggleFilter('status', val)}
            onClear={() => clearFilterDimension('status')}
          />

          <MultiSelectDropdown
            label="Tipo"
            selectedValues={filters.tipoContrato}
            options={tipoContratoOptions}
            onToggle={(val) => toggleFilter('tipoContrato', val)}
            onClear={() => clearFilterDimension('tipoContrato')}
          />

          {fiscalOptions.length > 0 && (
            <MultiSelectDropdown
              label="Fiscal / Gestor"
              selectedValues={filters.fiscalId}
              options={fiscalOptions}
              onToggle={(val) => toggleFilter('fiscalId', val)}
              onClear={() => clearFilterDimension('fiscalId')}
            />
          )}

          {/* Botão de Limpar Filtros Sincronizado */}
          {isAnyFilterActive && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sempi-plum/10 text-sempi-plum hover:bg-sempi-plum hover:text-white rounded-lg text-xs font-semibold transition-all shadow-2xs"
              title="Atalho: Tecla Esc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar ({activeFiltersCount})</span>
              <span className="px-1.5 py-0.2 bg-white/40 text-[10px] font-mono rounded-sm">
                Esc
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Linha 2: Chips de Filtros Visuais Ativos */}
      {isAnyFilterActive && (
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-sempi-plum" />
            <span>Filtros ({activeFiltersCount}):</span>
          </div>

          {activeFilterChips.map((chip, idx) => (
            <span
              key={`${chip.key}-${chip.itemValue || idx}`}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-md text-xs font-sans font-medium"
            >
              <span className="text-slate-500 font-normal">{chip.label}:</span>
              <span className="font-semibold">{chip.displayValue}</span>
              <button
                onClick={() => removeFilterItem(chip.key, chip.itemValue)}
                className="p-0.5 text-slate-400 hover:text-sempi-carmine rounded-sm hover:bg-white transition-colors"
                title={`Remover filtro ${chip.displayValue}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          <button
            onClick={clearAllFilters}
            className="text-xs text-slate-500 hover:text-sempi-plum underline underline-offset-2 ml-1"
          >
            Redefinir tudo
          </button>
        </div>
      )}
    </div>
  );
}
