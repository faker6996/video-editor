"use client";

import React from "react";

interface Props {
  src: string; // video url
  subtitleUrl?: string; // vtt url
  language?: string; // 'vi'
}

export default function VideoPlayer({ src, subtitleUrl, language = "vi" }: Props) {
  return (
    <div className="w-full flex justify-center">
      <style jsx>{`
        .video-player-small-subs::cue {
          font-size: 14px !important;
          line-height: 1.2 !important;
          background-color: hsl(var(--popover) / 0.9) !important;
          color: hsl(var(--popover-foreground)) !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
        }
      `}</style>
      <div className="w-full max-w-3xl">
        <div className="rounded-lg border bg-muted overflow-hidden">
          {/* 16:9 responsive container */}
          <div className="relative w-full pt-[56.25%]">
            <video controls className="absolute inset-0 h-full w-full object-contain bg-background video-player-small-subs" crossOrigin="anonymous">
              <source src={src} type="video/mp4" />
              {subtitleUrl && <track kind="subtitles" srcLang={language} src={subtitleUrl} label={`Sub ${language.toUpperCase()}`} default />}
            </video>
          </div>
        </div>
      </div>
    </div>
  );
}
