module Semilattice 
  ( class Semilattice
  , join, (\/)
  ) where

import Prelude (class Semigroup, (<>))
-- import Data.Map as Map

-- | A algebraic structure with element meets: <http://en.wikipedia.org/wiki/Semilattice>
--
-- > Associativity: x /\ (y /\ z) == (x /\ y) /\ z
-- > Commutativity: x /\ y == y /\ x
-- > Idempotency:   x /\ x == x
class Semigroup a <= Semilattice a

join :: forall a. Semilattice a => a -> a -> a
join = (<>)

infixr 6 join as \/

-- instance mapJoinSemiLattice :: (Ord k, JoinSemiLattice v) => JoinSemiLattice (Map.Map k v) where
--   join = Map.unionWith join
