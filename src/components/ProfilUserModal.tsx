import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Lock,
  Camera,
  Check,
  AlertCircle,
  FileBadge,
  Save,
  UploadCloud,
} from 'lucide-react';
import { User as UserType } from '../types';

interface ProfilUserModalProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (updatedUser: UserType) => void;
}

export const ProfilUserModal: React.FC<ProfilUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const [nama, setNama] = useState(user.nama || '');
  const [noTelepon, setNoTelepon] = useState(user.noTelepon || '');
  const [nomorSIP, setNomorSIP] = useState(user.nomorSIP || '');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  const [foto, setFoto] = useState(user.foto || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Ukuran foto maksimal 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFoto(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (passwordBaru && passwordBaru !== konfirmasiPassword) {
      setErrorMsg('Konfirmasi password tidak cocok');
      return;
    }

    if (passwordBaru && passwordBaru.length < 5) {
      setErrorMsg('Password baru minimal 5 karakter');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('sim_auth_token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nama: nama.trim(),
          noTelepon: noTelepon.trim(),
          nomorSIP: nomorSIP.trim() || undefined,
          password: passwordBaru ? passwordBaru.trim() : undefined,
          foto: foto || undefined,
        }),
      });

      const json = await res.json();
      if (json.success && json.user) {
        setSuccessMsg('Profil berhasil disimpan');
        onProfileUpdated(json.user);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setErrorMsg(json.message || 'Gagal menyimpan profil');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Profil & Akun Pengguna</h2>
              <p className="text-xs text-slate-400">Perbarui identitas, kontak, dan keamanan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Photo Avatar Preview & Upload */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="relative group">
              {foto ? (
                <img
                  src={foto}
                  alt={user.nama}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400 font-bold text-xl">
                  {user.nama ? user.nama.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <label
                htmlFor="photo-upload"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-emerald-500 text-slate-950 shadow cursor-pointer hover:bg-emerald-400 transition"
                title="Unggah Foto Profil"
              >
                <Camera className="w-3.5 h-3.5" />
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1">
              <div className="text-sm font-bold text-white">{user.nama}</div>
              <div className="text-xs text-emerald-400 font-medium">{user.role}</div>
              <label
                htmlFor="photo-upload"
                className="inline-flex items-center gap-1.5 mt-1.5 text-xs text-slate-400 hover:text-emerald-400 cursor-pointer font-medium"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Ganti Foto Profil (JPG/PNG maks 2MB)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nama Lengkap & Gelar <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nomor Telepon / WhatsApp
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="tel"
                placeholder="08xxxxxxxxxx"
                value={noTelepon}
                onChange={(e) => setNoTelepon(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {(user.role === 'Dokter' || user.role === 'Perawat') && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nomor Surat Izin Praktik (SIP / STR)
              </label>
              <div className="relative">
                <FileBadge className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Contoh: 446.1/042/SIP-D/2026"
                  value={nomorSIP}
                  onChange={(e) => setNomorSIP(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-300 block mb-2">
              Ubah Password (Kosongkan jika tidak ingin mengubah)
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Password Baru</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="Min 5 karakter"
                    value={passwordBaru}
                    onChange={(e) => setPasswordBaru(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Konfirmasi Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="Ulangi password"
                    value={konfirmasiPassword}
                    onChange={(e) => setKonfirmasiPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white font-medium text-xs transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
