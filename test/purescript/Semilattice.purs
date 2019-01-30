module Test.Semilattice where

import Data.Map as Map
import Data.Tuple (Tuple)
import Effect (Effect)
import Effect.Console (log)
import Prelude (class Eq, Unit, discard, map, (==))
import Semilattice (class Semilattice, (\/))
import Test.QuickCheck (class Arbitrary, arbitrary, quickCheck)
import Type.Data.Boolean (kind Boolean)

newtype IntMap = IntMap (Map.Map String Int)
derive newtype instance eqIntMap :: Eq IntMap
derive newtype instance semilatticeIntMap :: Semilattice IntMap

instance arbitraryIntMap :: Arbitrary IntMap where
  arbitrary = map fromArray arbitrary
    where
      fromArray :: Array (Tuple String Int) -> IntMap
      fromArray a = IntMap (Map.fromFoldable a)

test :: Effect Unit
test = do
  log "Associative law x \\/ (y \\/ z) == (x \\/ y) \\/ z"
  quickCheck (associative :: IntMap ->  IntMap -> IntMap -> Boolean)

  log "Idempotence law x \\/ x == x"
  quickCheck (idempotent :: IntMap -> Boolean)

  log "Commutativity law x \\/ y == y \\/ x"
  quickCheck (commutative :: IntMap -> IntMap -> Boolean)

associative :: forall s. Eq s => Semilattice s => s -> s -> s -> Boolean
associative x y z = (x \/ (y \/ z)) == ((x \/ y) \/ z)

idempotent :: forall s. Eq s => Semilattice s => s -> Boolean
idempotent x = (x \/ x) == x

commutative :: forall s. Eq s => Semilattice s => s -> s -> Boolean
commutative x y = (x \/ y) == (y \/ x)
