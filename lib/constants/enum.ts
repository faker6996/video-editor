// lib/constants/http-method.ts
export enum HTTP_METHOD_ENUM {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

export enum Z_INDEX_LEVEL {
  BASE = 100, // base layout, header, fixed nav
  DROPDOWN = 1000, // dropdown, popover, select
  TOOLTIP = 2000, // tooltip
  DIALOG = 10000, // modal, popup
  LOADING = 100000, // global loading, overlay
}

export enum LOCALE {
  VI = "vi",
  EN = "en",
  KO = "ko",
  JA = "ja",
}

export enum MESSAGE_TYPE {
  PUBLIC = 0,
  PRIVATE = 1,
  GROUP = 2,
}
