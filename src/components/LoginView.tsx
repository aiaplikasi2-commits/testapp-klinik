import React, { useState } from 'react';
import {
  Stethoscope,
  Lock,
  User as UserIcon,
  Shield,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Server,
  ArrowRight,
} from 'lucide-react';
import { User } from '../types';
import { apiFetch, setAuthToken } from '../api/client';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onOpenTv?: () => void;
  onOpenPatientTicket?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onOpenTv,
  onOpenPatientTicket,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dynamicAccounts, setDynamicAccounts] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/auth/preset-accounts')
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.presets)) {
          setDynamicAccounts(j.presets);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e?: React.FormEvent, overrideUser?: string, overridePass?: string) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const u = overrideUser || username;
    const p = overridePass || password;

    try {
      const res = await apiFetch<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: u, password: p }),
      });

      if (res.success && res.token && res.user) {
        setAuthToken(res.token);
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message || 'Login gagal, periksa nama pengguna dan kata sandi');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-teal-50/50 to-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 text-white shadow-lg mb-3 ring-4 ring-teal-100">
          <Stethoscope className="w-9 h-9" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          SIM Klinik
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-7 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200/80">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Nama Pengguna (Username)
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Masukkan username akun"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Kata Sandi (Password)
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Masukkan password"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-60 transition"
            >
              {loading ? 'Memverifikasi...' : 'Masuk ke Sistem Klinik'}
            </button>
          </form>

          {/* Quick Login / Account hints */}
          <div className="mt-5 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Akun Terdaftar di Sistem
              </span>
              <span className="text-[11px] text-teal-600 font-semibold">Role-Based Access Control</span>
            </div>

            <div className="space-y-1.5">
              {dynamicAccounts.map((acc) => (
                <div
                  key={acc.username}
                  onClick={() => {
                    setUsername(acc.username);
                    if (acc.username === 'admin') setPassword('admin123');
                  }}
                  className="flex items-center justify-between p-2 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 cursor-pointer transition text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold">
                      {acc.role}
                    </span>
                    <span className="font-semibold text-slate-800">{acc.nama}</span>
                    <span className="text-slate-400">(@{acc.username})</span>
                  </div>
                  <span className="text-teal-600 font-medium">Gunakan</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              * Administrator dapat membuat akun baru untuk Dokter, Perawat, Petugas Farmasi, dan Kasir melalui menu Manajemen Pengguna.
            </p>
          </div>

          {/* Direct Public Access Buttons: TV Display & Patient Ticket */}
          <div className="mt-5 pt-4 border-t border-slate-200 grid grid-cols-2 gap-2.5">
            {onOpenTv && (
              <button
                type="button"
                onClick={onOpenTv}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
              >
                <span>Layar TV Antrean</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onOpenPatientTicket && (
              <button
                type="button"
                onClick={onOpenPatientTicket}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                <span>Tiket Mandiri Pasien</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
