module Test.Main where

import Prelude
import Effect (Effect)
import Effect.Console (log)
import Test.QuickCheck

import Test.Semilattice as Semilattice

main :: Effect Unit
main = do
  log "Semilattice tests"
  Semilattice.test
