'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Upload, X, RefreshCw, Image as ImageIcon, FileText, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  scope: 'avatars' | 'profile' | 'feed' | 'events' | 'materials' | 'proofs' | 'gallery' | 'projects';
  accept?: string;
  allowPaste?: boolean;
  label?: string;
  onUploaded: (url: string) => void;
  onClear?: () => void;
  currentUrl?: string;
}

export function FileUploadZone({
  scope,
  accept = 'image/png,image/jpeg,image/webp',
  allowPaste = true,
  label = 'Enviar arquivo (clique, arraste ou cole com Ctrl+V)',
  onUploaded,
  onClear,
  currentUrl,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageConfigured, setStorageConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .get('/uploads/status')
      .then((res) => setStorageConfigured(Boolean(res.data?.configured)))
      .catch(() => setStorageConfigured(null));
  }, []);

  useEffect(() => {
    if (!allowPaste) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleFileSelection(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [allowPaste]);

  const handleFileSelection = async (file: File) => {
    setError(null);
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
    } else {
      setPreviewUrl(null);
    }

    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const response = await api.post(`/uploads/${scope}`, arrayBuffer, {
        headers: { 'Content-Type': file.type },
        timeout: 60_000,
      });
      onUploaded(response.data.url);
    } catch (err: any) {
      const responseError = err.response?.data?.error || err.response?.data?.message;
      if (responseError) {
        setError(responseError);
      } else if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        setError('O envio demorou mais que o esperado. Tente novamente com uma imagem menor ou verifique o storage no servidor.');
      } else if (!err.response) {
        setError(`Não foi possível conectar à API para enviar o arquivo (${err.message || 'erro de rede'}).`);
      } else {
        setError(`Falha no envio (HTTP ${err.response.status}). Verifique os logs da API.`);
      }
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onClear?.();
  };

  return (
    <div className="space-y-3">
      {storageConfigured === false && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-sm text-[11px] text-amber-200 flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-400" />
          <span>
            Storage S3 externo ainda não configurado no servidor (<code>STORAGE_*</code>). O envio
            de arquivo reportará indisponibilidade até ser configurado.
          </span>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFileSelection(file);
        }}
        className={cn(
          'border border-dashed rounded-sm p-6 text-center transition-all cursor-pointer bg-obsidian/60',
          isDragging
            ? 'border-royal-gold bg-royal-gold/10'
            : 'border-white/15 hover:border-royal-gold/40'
        )}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelection(file);
          }}
        />
        <Upload size={22} className="mx-auto text-royal-gold mb-2" />
        <p className="text-xs font-medium text-white/70">{label}</p>
        {uploading && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-royal-gold mt-2">
            Enviando ao armazenamento seguro...
          </p>
        )}
      </div>

      {(previewUrl || selectedFile) && (
        <div className="bg-obsidian border border-white/10 rounded-sm p-3 flex items-center gap-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-sm border border-white/10 shrink-0"
            />
          ) : (
            <div className="w-16 h-16 bg-graphite border border-white/10 rounded-sm flex items-center justify-center shrink-0">
              {selectedFile?.type.includes('pdf') ? (
                <FileText size={22} className="text-royal-gold" />
              ) : (
                <ImageIcon size={22} className="text-royal-gold" />
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {selectedFile?.name || 'Arquivo anexado'}
            </p>
            {selectedFile && (
              <p className="text-[10px] text-white/40 mt-0.5">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-2 text-white/50 hover:text-royal-gold border border-white/10 rounded-sm"
              title="Substituir arquivo"
            >
              <RefreshCw size={14} />
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="p-2 text-white/50 hover:text-red-400 border border-white/10 rounded-sm"
              title="Remover arquivo"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 bg-red-500/5 border border-red-500/20 p-2.5 rounded-sm">
          {error}
        </p>
      )}
    </div>
  );
}
