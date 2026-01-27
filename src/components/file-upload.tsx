'use client';

import { useState, useRef } from 'react';
import { Upload, X, File as FileIcon, Loader2, Paperclip } from 'lucide-react';

interface FileUploadProps {
    onUploadComplete: (attachments: any[]) => void;
    maxFiles?: number;
    maxSizeMB?: number; // MB
}

interface UploadingFile {
    id: string;
    file: File;
    progress: number;
    error?: string;
    uploaded?: any; // serverside response
}

export default function FileUpload({ onUploadComplete, maxFiles = 5, maxSizeMB = 10 }: FileUploadProps) {
    const [files, setFiles] = useState<UploadingFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            await processFiles(newFiles);
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const processFiles = async (newFiles: File[]) => {
        if (files.length + newFiles.length > maxFiles) {
            alert(`En fazla ${maxFiles} dosya yükleyebilirsiniz.`);
            return;
        }

        const filesToUpload = newFiles.map(file => ({
            id: Math.random().toString(36).substring(7),
            file,
            progress: 0
        }));

        setFiles(prev => [...prev, ...filesToUpload]);

        // Start uploading one by one or parallel
        for (const fileObj of filesToUpload) {
            if (fileObj.file.size > maxSizeMB * 1024 * 1024) {
                setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, error: `Dosya çok büyük (Max ${maxSizeMB}MB)` } : f));
                continue;
            }

            await uploadFile(fileObj);
        }
    };

    const uploadFile = async (fileObj: UploadingFile) => {
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', fileObj.file);

            // Simulate progress (since fetch doesn't support it natively easily without XHR)
            setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, progress: 50 } : f));

            const res = await fetch('/api/uploads', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Yükleme başarısız');

            const data = await res.json();

            setFiles(prev => {
                const updated = prev.map(f => f.id === fileObj.id ? { ...f, progress: 100, uploaded: data } : f);
                // Notify parent
                const completed = updated.filter(f => f.uploaded).map(f => f.uploaded);
                onUploadComplete(completed);
                return updated;
            });

        } catch (error) {
            console.error(error);
            setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, error: 'Yükleme hatası' } : f));
        } finally {
            setUploading(false);
        }
    };

    const removeFile = (id: string) => {
        setFiles(prev => {
            const updated = prev.filter(f => f.id !== id);
            const completed = updated.filter(f => f.uploaded).map(f => f.uploaded);
            onUploadComplete(completed);
            return updated;
        });
    };

    return (
        <div className="file-upload">
            <div className="upload-trigger">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    className="hidden-input"
                    id="file-upload-input"
                />
                <label htmlFor="file-upload-input" className="attach-btn">
                    <Paperclip size={18} />
                    <span>Dosya Ekle</span>
                </label>
            </div>

            {files.length > 0 && (
                <div className="file-list">
                    {files.map(file => (
                        <div key={file.id} className="file-item">
                            <div className="file-icon">
                                {file.error ? <AlertCircle size={16} className="text-red-500" /> : <FileIcon size={16} />}
                            </div>
                            <div className="file-info">
                                <span className="file-name">{file.file.name}</span>
                                {file.error ? (
                                    <span className="file-error">{file.error}</span>
                                ) : (
                                    <span className="file-size">{(file.file.size / 1024).toFixed(1)} KB</span>
                                )}
                            </div>
                            {file.progress < 100 && !file.error && (
                                <Loader2 size={14} className="spin" />
                            )}
                            <button type="button" onClick={() => removeFile(file.id)} className="remove-btn">
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .file-upload {
                    margin-top: 0.5rem;
                }
                .hidden-input {
                    display: none;
                }
                .attach-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--gray-600);
                    font-size: 0.875rem;
                    cursor: pointer;
                    padding: 0.5rem 0.75rem;
                    border: 1px solid var(--gray-200);
                    border-radius: 0.375rem;
                    background: white;
                    transition: all 0.2s;
                }
                .attach-btn:hover {
                    background: var(--gray-50);
                    border-color: var(--gray-300);
                }
                .file-list {
                    margin-top: 0.75rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .file-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.5rem;
                    background: var(--gray-50);
                    border-radius: 0.375rem;
                    font-size: 0.8125rem;
                }
                .file-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .file-name {
                    font-weight: 500;
                    color: var(--gray-700);
                }
                .file-size {
                    color: var(--gray-500);
                    font-size: 0.75rem;
                }
                .file-error {
                    color: var(--danger-600);
                    font-size: 0.75rem;
                }
                .remove-btn {
                    border: none;
                    background: none;
                    color: var(--gray-400);
                    cursor: pointer;
                    padding: 0.25rem;
                }
                .remove-btn:hover {
                    color: var(--danger-500);
                }
                .spin {
                    animation: spin 1s linear infinite;
                    color: var(--primary-500);
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

import { AlertCircle } from 'lucide-react';
