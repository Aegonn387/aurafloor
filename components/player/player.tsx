"use client"

import { MiniPlayer } from "./mini-player"
import { FullPlayer } from "./full-player"

export function Player() {
  return (
    <>
      <MiniPlayer />
      <FullPlayer />
    </>
  )
}
