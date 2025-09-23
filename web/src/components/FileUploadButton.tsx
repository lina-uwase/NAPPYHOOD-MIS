"use client";
import React from 'react';

interface FileUploadButtonProps {
  label?: string;
  accept?: string;
  className?: string;
  onSelect?: (file: File) => void;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  label = 'Upload',
  accept = '*/*',
  className = '',
  onSelect,
}) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelect?.(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
      <button onClick={handleClick} className={className}>
        {label}
      </button>
    </>
  );
};

export default FileUploadButton;


