'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { PerfilUsuarioRow } from '@/actions/usuarios.actions';
import { toggleUsuarioStatusAction } from '@/actions/usuarios.actions';
import { NovoUsuarioDrawer } from './NovoUsuarioDrawer';
import { EditarUsuarioDrawer } from './EditarUsuarioDrawer';
import { Pagination } from '@/components/ui-ledger/Pagination';
import { ExportButton } from '@/components/ui-ledger/ExportButton';
import { CodeBadge } from '@/components/ui-ledger/CodeBadge';
import {
  UserPlus,
  Search,
  Filter,
  Shield,
  Edit2,
  CheckCircle,
  XCircle,
  Eye,
  Users,
} from 'lucide-react';
import type { UserRole } from '@/lib/types/database.types';

interface UsuariosTableClientProps {
  usuarios: PerfilUsuarioRow[];
  currentUserRole?: UserRole;
}

export function UsuariosTableClient({ usuarios, currentUserRole }: UsuariosTableClientProps) {
  const router = useRouter();

  // Estados dos Drawers
  const [isNovoDrawerOpen, setIsNovoDrawerOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<PerfilUsuarioRow | null>(null);

  // Estados de Filtro e Busca
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('TODOS');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');

  // Estados de Paginação (Default: 10 registros por página)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const isReadOnly = currentUserRole === 'CONSULTA_TCE';

  // Filtragem dos usuários
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((u) => {
      if (search) {
        const term = search.toLowerCase();
        const matchNome = u.nome_completo.toLowerCase().includes(term);
        const matchId = u.id_funcional.toLowerCase().includes(term);
        const matchCpf = u.cpf.includes(term);
        const matchSetor = u.setor.toLowerCase().includes(term);
        if (!matchNome && !matchId && !matchCpf && !matchSetor) return false;
      }
      if (roleFilter !== 'TODOS' && u.role !== roleFilter) return false;
      if (statusFilter === 'ATIVO' && !u.ativo) return false;
      if (statusFilter === 'INATIVO' && u.ativo) return false;
      return true;
    });
  }, [usuarios, search, roleFilter, statusFilter]);

  // Paginação aplicada sobre os filtrados
  const paginatedUsuarios = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsuarios.slice(start, start + pageSize);
  }, [filteredUsuarios, currentPage, pageSize]);

  // Colunas para exportação CSV
  const exportColumns = [
    { header: 'Nome Completo', accessor: (u: PerfilUsuarioRow) => u.nome_completo },
    { header: 'ID Funcional', accessor: (u: PerfilUsuarioRow) => u.id_funcional },
    { header: 'CPF', accessor: (u: PerfilUsuarioRow) => u.cpf },
    { header: 'Setor / Departamento', accessor: (u: PerfilUsuarioRow) => u.setor },
    { header: 'Perfil RBAC', accessor: (u: PerfilUsuarioRow) => u.role },
    { header: 'Status', accessor: (u: PerfilUsuarioRow) => (u.ativo ? 'ATIVO' : 'INATIVO') },
  ];

  const handleToggleStatus = async (usuario: PerfilUsuarioRow) => {
    if (isReadOnly) return;
    const confirmMsg = usuario.ativo
      ? `Deseja realmente desativar o usuário ${usuario.nome_completo}?`
      : `Deseja reativar o usuário ${usuario.nome_completo}?`;
    if (!confirm(confirmMsg)) return;

    await toggleUsuarioStatusAction(usuario.id, !usuario.ativo);
    router.refresh();
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <span className="px-2 py-0.5 rounded-sm bg-purple-100 text-purple-800 text-[10px] font-mono font-bold uppercase">Administrador</span>;
      case 'GESTOR_CONTRATOS':
        return <span className="px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800 text-[10px] font-mono font-bold uppercase">Gestor</span>;
      case 'FINANCEIRO':
        return <span className="px-2 py-0.5 rounded-sm bg-teal-100 text-teal-800 text-[10px] font-mono font-bold uppercase">Financeiro</span>;
      case 'FISCAL':
        return <span className="px-2 py-0.5 rounded-sm bg-amber-100 text-amber-800 text-[10px] font-mono font-bold uppercase">Fiscal</span>;
      case 'CONSULTA_TCE':
        return <span className="px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 text-[10px] font-mono font-bold uppercase">Consulta / Leitura</span>;
      default:
        return <span className="px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600 text-[10px] font-mono">{role}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Ações Superiores e Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs">
        {/* Omnibox de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por nome, ID funcional, CPF ou setor..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sempi-plum/20 focus:border-sempi-plum font-sans"
          />
        </div>

        {/* Filtros Dropdown e Botões */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro Role */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-hidden"
          >
            <option value="TODOS">Todos os Perfis</option>
            <option value="ADMIN">Administrador</option>
            <option value="GESTOR_CONTRATOS">Gestor de Contratos</option>
            <option value="FINANCEIRO">Financeiro</option>
            <option value="FISCAL">Fiscal</option>
            <option value="CONSULTA_TCE">Consulta / Leitura</option>
          </select>

          {/* Filtro Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-hidden"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="ATIVO">Ativos</option>
            <option value="INATIVO">Inativos</option>
          </select>

          {/* Botão de Exportação CSV */}
          <ExportButton
            data={filteredUsuarios}
            columns={exportColumns}
            filename="usuarios_sgc_sempi"
            label="Exportar CSV"
          />

          {/* Botão Novo Usuário (Oculto em modo somente leitura) */}
          {!isReadOnly ? (
            <button
              onClick={() => setIsNovoDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sempi-plum text-white hover:bg-sempi-plum-hover rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Novo Usuário</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-mono">
              <Eye className="w-3.5 h-3.5" />
              <span>Modo Somente Leitura</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="table-responsive-container">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase text-slate-500 tracking-wider">
                <th className="p-3.5 pl-5">Servidor / Nome</th>
                <th className="p-3.5">ID Funcional</th>
                <th className="p-3.5">CPF</th>
                <th className="p-3.5">Setor / Lotação</th>
                <th className="p-3.5 text-center">Perfil (RBAC)</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 pr-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedUsuarios.length > 0 ? (
                paginatedUsuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 pl-5 font-semibold text-slate-900">
                      {u.nome_completo}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      <CodeBadge value={u.id_funcional} />
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {u.cpf}
                    </td>
                    <td className="p-3.5 text-slate-700 max-w-[200px] truncate" title={u.setor}>
                      {u.setor}
                    </td>
                    <td className="p-3.5 text-center">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="p-3.5 text-center">
                      {u.ativo ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-xs border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          <span>Ativo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-xs border border-red-200">
                          <XCircle className="w-3 h-3" />
                          <span>Inativo</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      {!isReadOnly ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setEditingUsuario(u)}
                            className="p-1.5 text-slate-500 hover:text-sempi-plum hover:bg-slate-100 rounded-md transition-colors"
                            title="Editar usuário"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-md transition-colors ${
                              u.ativo
                                ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={u.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                          >
                            {u.ativo ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-mono">Leitura</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-mono text-xs">
                    Nenhum usuário encontrado com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Barra de Paginação Integrada (Default 10 por página) */}
        <Pagination
          currentPage={currentPage}
          totalRecords={filteredUsuarios.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Drawers */}
      <NovoUsuarioDrawer
        isOpen={isNovoDrawerOpen}
        onClose={() => setIsNovoDrawerOpen(false)}
        onSuccess={() => router.refresh()}
      />

      <EditarUsuarioDrawer
        isOpen={!!editingUsuario}
        onClose={() => setEditingUsuario(null)}
        usuario={editingUsuario}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
