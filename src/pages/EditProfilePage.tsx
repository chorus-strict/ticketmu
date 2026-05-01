import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Smartphone, Camera, Loader2, Check, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import Layout from '../components/layout/Layout';
import { getSupabase } from '../lib/supabase';
import { getAvatar, DEFAULT_AVATAR } from '../lib/utils';
import api from '../services/api';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { t } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  
  // Avatar states
  const [previewAvatar, setPreviewAvatar] = useState(getAvatar(user?.avatar));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const validateFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image (JPG, PNG, or WebP)');
      return false;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return false;
    }
    setError('');
    return true;
  };

  const handleUrlChange = (url: string) => {
    setAvatarUrl(url);
    setSelectedFile(null); // URL input clears file selection
    if (url) {
      setPreviewAvatar(url);
    } else {
      setPreviewAvatar(DEFAULT_AVATAR);
    }
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      setAvatarUrl(''); // File selection clears URL input
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Image upload service is not configured.');
    }
    const fileExt = file.name.split('.').pop();
    const fileName = `users/${user?.id}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new Error('Failed to upload image. Please try again.');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    setError('');

    try {
      let finalAvatarUrl = avatarUrl || user?.avatar || '';
      
      if (selectedFile) {
        finalAvatarUrl = await uploadAvatar(selectedFile);
      }
      
      await api.put('/user/update-profile', { 
        name, 
        phone, 
        avatar: finalAvatarUrl 
      });

      await refreshUser();
      
      setIsSubmitting(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        navigate(-1);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <main className="max-w-lg mx-auto p-5 pb-20">
        <div className="flex flex-col items-center mb-10">
          <div 
            className={`relative group cursor-pointer transition-transform active:scale-95 ${isDragging ? 'scale-110' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={`w-32 h-32 rounded-3xl overflow-hidden border-4 transition-colors ${isDragging ? 'border-indigo-600' : 'border-white dark:border-slate-800'} shadow-xl relative`}>
              <img 
                src={previewAvatar} 
                alt="Profile" 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_AVATAR;
                }}
              />
              {isDragging && (
                <div className="absolute inset-0 bg-indigo-600/20 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-lg">
                    <Camera className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              )}
            </div>
            <button 
              type="button"
              className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg border-2 border-white dark:border-slate-800 hover:bg-indigo-700 transition-all group-hover:scale-110"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept="image/jpeg,image/png,image/webp" 
              className="hidden" 
            />
          </div>
          <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            {isDragging ? 'Drop to change' : 'Tap or Drag to change'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
              <AlertCircle className="w-5 h-5 text-red-500 flex-none" />
              <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{t('account.avatar_url')}</label>
            <div className="relative group">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors h-5 w-5" />
              <input 
                value={avatarUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 rounded-xl py-4 pl-12 pr-4 font-medium transition-all outline-none text-slate-900 dark:text-white" 
                placeholder="https://example.com/image.jpg" 
                type="url"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium ml-1">Or upload a file by clicking the avatar circle above.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{t('account.name')}</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors h-5 w-5" />
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 rounded-xl py-4 pl-12 pr-4 font-medium transition-all outline-none text-slate-900 dark:text-white" 
                placeholder="Full Name" 
                type="text"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input 
                value={email}
                disabled
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl py-4 pl-12 pr-4 font-medium text-slate-400 cursor-not-allowed outline-none" 
                placeholder="Email" 
                type="email"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium ml-1">Email cannot be changed for security reasons.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{t('account.phone')}</label>
            <div className="relative group">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors h-5 w-5" />
              <input 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 rounded-xl py-4 pl-12 pr-4 font-medium transition-all outline-none text-slate-900 dark:text-white" 
                placeholder="+1 (555) 000-0000" 
                type="tel"
              />
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              disabled={isSubmitting || !name}
              className={`w-full py-4.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
                showSuccess 
                  ? 'bg-green-600 shadow-green-600/20 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 text-white disabled:bg-indigo-600/50 disabled:cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{selectedFile ? 'Uploading Avatar...' : 'Saving...'}</span>
                </>
              ) : showSuccess ? (
                <>
                  <Check className="h-5 w-5" />
                  <span>Saved Successfully</span>
                </>
              ) : (
                <span>{t('account.save')}</span>
              )}
            </button>
          </div>
        </form>
      </main>
    </Layout>
  );
}
