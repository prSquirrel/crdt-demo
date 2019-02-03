module Test.Semilattice where

import Data.Map as Map
import Data.Map.Gen (genMap)
import Effect (Effect)
import Effect.Console (log)
import Prelude
import Semilattice (class Semilattice, (\/))
import Test.QuickCheck (class Arbitrary, arbitrary, quickCheck)
import Type.Data.Boolean (kind Boolean)
import Type.Proxy (Proxy(..))

newtype IntMap = IntMap (Map.Map String Int)
derive newtype instance eqIntMap :: Eq IntMap
derive newtype instance semilatticeIntMap :: Semilattice IntMap

instance arbitraryMap :: Arbitrary IntMap where
  arbitrary = IntMap <$> genMap arbitrary arbitrary

test :: Effect Unit
test = do
  checkSemilatticeLaws (Proxy :: Proxy IntMap)

-- Test.QuickCheck.Property.(.&&.) would be nice
checkSemilatticeLaws 
  :: forall s
   . Arbitrary s 
  => Eq s 
  => Semilattice s 
  => Proxy s 
  -> Effect Unit
checkSemilatticeLaws _ = do
  log "Associativity law"
  quickCheck (associative :: s ->  s -> s -> Boolean)

  log "Idempotence law"
  quickCheck (idempotent :: s -> Boolean)

  log "Commutativity law"
  quickCheck (commutative :: s -> s -> Boolean)

associative :: forall s. Eq s => Semilattice s => s -> s -> s -> Boolean
associative x y z = (x \/ (y \/ z)) == ((x \/ y) \/ z)

idempotent :: forall s. Eq s => Semilattice s => s -> Boolean
idempotent x = (x \/ x) == x

commutative :: forall s. Eq s => Semilattice s => s -> s -> Boolean
commutative x y = (x \/ y) == (y \/ x)
