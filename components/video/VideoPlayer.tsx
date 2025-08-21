"use client";

import React from 'react';

interface Props {
  src: string; // video url
  subtitleUrl?: string; // vtt url
  language?: string; // 'vi'
}

export default function VideoPlayer({ src, subtitleUrl, language = 'vi' }: Props) {
  return (
    <div className="rounded-lg border bg-muted overflow-hidden">
      <video controls className="w-full h-auto" crossOrigin="anonymous">
        <source src={src} type="video/mp4" />
        {subtitleUrl && (
          <track
            kind="subtitles"
            srcLang={language}
            src={subtitleUrl}
            label={`Sub ${language.toUpperCase()}`}
            default
          />
        )}
      </video>
    </div>
  );
}

