module Semilattice 
  ( class Semilattice
  , join, (\/)
  ) where

import Data.Ord

import Data.Map as Map
import Data.Ord.Max (Max)
import Prelude ((<>))

-- | A join semilattice: http://en.wikipedia.org/wiki/Semilattice
--
-- > Associativity: x \/ (y \/ z) == (x \/ y) \/ z
-- > Commutativity: x \/ y == y \/ x
-- > Idempotency:   x \/ x == x
class Semilattice a where
  join :: a -> a -> a

infixr 6 join as \/

-- Collections
instance mapSemilattice :: (Ord k, Semilattice v) => Semilattice (Map.Map k v) where
  join = Map.unionWith join

-- Semigroup
instance upperBoundFormsSemilattice :: Ord a => Semilattice (Max a) where
  join = (<>)

instance semilatticeInt :: Semilattice Int where
  join = max
