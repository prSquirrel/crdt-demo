module Util (fromRight) where

import Data.Either (Either, fromRight) as E
import Partial.Unsafe (unsafePartial)

fromRight :: forall a b. E.Either a b -> b
fromRight = unsafePartial E.fromRight
