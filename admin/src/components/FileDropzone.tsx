import { useRef, useState } from "react";
import { formatFileSize } from "../lib/format";

type FileDropzoneProps = {
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  disabled?: boolean;
  onFile: (file: File | null) => void;
};

export function FileDropzone({
  label,
  hint,
  accept,
  file,
  disabled = false,
  onFile,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function pickFile(next: File | null) {
    onFile(next);
  }

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div
        className={`dropzone ${dragOver ? "drag-over" : ""} ${file ? "has-file" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) {
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled) {
            return;
          }
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) {
            pickFile(dropped);
          }
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) {
              inputRef.current?.click();
            }
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="dropzone-input"
          disabled={disabled}
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="dropzone-file">
            <strong>{file.name}</strong>
            <span>{formatFileSize(file.size)}</span>
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                pickFile(null);
                if (inputRef.current) {
                  inputRef.current.value = "";
                }
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="dropzone-empty">
            <span className="dropzone-icon">↑</span>
            <strong>Drop file here or click to browse</strong>
            <span>{hint}</span>
          </div>
        )}
      </div>
    </div>
  );
}
