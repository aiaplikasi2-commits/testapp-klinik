import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  KeyRound,
  History,
  CheckCircle2,
  AlertCircle,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { User, AuditLog, UserRole } from '../types';
import { apiFetch } from '../api/client';

interface PenggunaViewProps {
  currentUser: User;
}

export const PenggunaView: React.FC<PenggunaViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Form Tambah Pengguna
  const [showAddModal, setShowAddModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [role, setRole] = useState<UserRole>('Dokter');
  const [nomorSIP, setNomorSIP] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const availableRoles: UserRole[] = [
    'Administrator',
    'Pemilik Klinik',
    'Dokter',
    'Perawat',
    'Petugas Pendaftaran',
    'Petugas Farmasi',
    'Kasir',
  ];

  const fetchData = async () => {
    setLoading(true);
    const resUsers = await apiFetch<User[]>('/users');
    if (resUsers.success && resUsers.data) {
      setUsers(resUsers.data);
    }
    const resLogs = await apiFetch<AuditLog[]>('/audit-logs');
    if (resLogs.success && resLogs.data) {
      setAuditLogs(resLogs.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        nama,
        role,
        nomorSIP: role === 'Dokter' ? nomorSIP : undefined,
      }),
    });

    if (res.success) {
      setSuccessMsg(`Pengguna ${nama} (${username}) sebagai ${role} berhasil ditambahkan!`);
      setShowAddModal(false);
      setUsername('');
      setPassword('');
      setNama('');
      setNomorSIP('');
      fetchData();
    } else {
      setErrorMsg(res.message || 'Gagal menambahkan pengguna');
    }
    setSubmitting(false);
  };

  const isAdmin = currentUser.role === 'Administrator';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
              Keamanan & Kontrol Akses (RBAC)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
            Manajemen Akun Pengguna & Jejak Audit
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Hak akses berjenjang untuk 7 peran operasional klinik dengan otentikasi aman password hashing SHA-256.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Akun Petugas</span>
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-xs text-emerald-600 underline">
            Tutup
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-xs text-rose-600 underline">
            Tutup
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'users'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Daftar Akun Petugas & Dokter ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'audit'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Log Aktivitas Pengguna (Audit Trail)
        </button>
      </div>

      {/* TAB 1: USERS LIST */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Nama & Username</th>
                  <th className="p-3.5">Peran / Jabatan</th>
                  <th className="p-3.5">Nomor SIP (Dokter)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Tanggal Dibuat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{u.nama}</div>
                      <div className="text-[11px] text-slate-400">@{u.username}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-teal-100 text-teal-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">{u.nomorSIP || '-'}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Aktif
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">{u.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT TRAIL LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 uppercase">
              Jejak Audit Aktivitas Sistem Terkini
            </div>
            <button onClick={fetchData} className="text-xs text-teal-600 font-semibold hover:underline">
              Segarkan
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Belum ada log tercatat.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 hover:bg-slate-50 text-xs flex justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{log.nama}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">
                        {log.role}
                      </span>
                      <span className="text-[11px] text-teal-700 font-semibold">[{log.modul}]</span>
                    </div>
                    <div className="text-slate-600 mt-0.5">{log.detail}</div>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 flex-shrink-0">
                    <div>{log.aksi}</div>
                    <div>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString('id-ID') : '-'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH AKUN PETUGAS BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Tambah Akun Petugas Baru</h3>
            <p className="text-xs text-slate-500 mb-4">
              Akun akan langsung tersimpan di database pusat dan dapat digunakan di Web maupun Android.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: dr. Bambang Sutrisno, Sp.A"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peran / Jabatan Akses *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {role === 'Dokter' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor SIP (Surat Izin Praktik)
                  </label>
                  <input
                    type="text"
                    value={nomorSIP}
                    onChange={(e) => setNomorSIP(e.target.value)}
                    placeholder="446.1/123/SIP-D/2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="dokter3, perawat2, dll"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Akun Petugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
