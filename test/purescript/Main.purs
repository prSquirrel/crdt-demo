module Test.Main where

import Prelude
import Effect (Effect)
import Effect.Console (log)
import Test.QuickCheck

main :: Effect Unit
main = do
  quickCheck \n -> n + 1 == 1 + n

