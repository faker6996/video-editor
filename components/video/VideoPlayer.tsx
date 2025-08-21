"use client";

import React from 'react';

interface Props {
  src: string; // video url
  subtitleUrl?: string; // vtt url
  language?: string; // 'vi'
}

export default function VideoPlayer({ src, subtitleUrl, language = 'vi' }: Props) {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-3xl">
        <div className="rounded-lg border bg-muted overflow-hidden">
          {/* 16:9 responsive container */}
          <div className="relative w-full pt-[56.25%]">
            <video
              controls
              className="absolute inset-0 h-full w-full object-contain bg-black"
              crossOrigin="anonymous"
            >
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
        </div>
      </div>
    </div>
  );
}
