module VClock
  ( VClock (..)
  , initial
  , increment
  , lessThanOrEqualPartial
  , lessThanOrEqual
  , precedes
  , merge
  , asJson
  , fromJson
  , IntMap
  , ReplicaId
  ) where

import Prelude

import Data.Either (Either(..))
import Data.List as L
import Data.Map as Map
import Data.Maybe (fromMaybe)
import Data.Tuple as T
import Foreign.Object as O
import Semilattice (class Semilattice)
import Semilattice as Semilattice
import Simple.JSON as JSON
import Type.Data.Boolean (kind Boolean)
import Data.Foldable as Foldable
import Data.HeytingAlgebra ((&&), (||))
import Data.Eq ((==))

type IntMap key = Map.Map key Int
type ReplicaId = String

newtype VClock = VClock (IntMap ReplicaId)
derive newtype instance semilatticeVClock :: Semilattice VClock

derive newtype instance showVClock :: Show VClock

initial :: VClock
initial = VClock (Map.empty)

increment :: ReplicaId -> VClock -> VClock
increment replicaId (VClock intmap) = VClock newIncrements
  where
    newIncrements = Map.insert replicaId newValue intmap
    newValue = currentValue + 1
    currentValue = getOrZero replicaId intmap

-- Ord Map doesn't suit us because:
--   Ord.compare [ (newKey, 0), (key, 1) ] [ (key, 1) ]
--     > GT
-- While the expected behaviour would be to treat missing keys as 0.
-- 
-- Returns True if clock1 <= clock2
lessThanOrEqualPartial :: VClock -> VClock -> Boolean
lessThanOrEqualPartial (VClock firstIntmap) (VClock secondIntmap) =
  Foldable.all lte kvs
    where
      lte (T.Tuple k1 v1) = 
        v1 <= (getOrZero k1 secondIntmap)
      kvs = (Map.toUnfoldable firstIntmap) :: L.List (T.Tuple ReplicaId Int)

lessThanOrEqual :: ReplicaId -> VClock -> ReplicaId -> VClock -> Boolean
lessThanOrEqual aId a bId b = 
  case lessThanOrEqualPartial a b of
    true -> true
    false -> 
      case lessThanOrEqualPartial b a of
        true -> false
        false -> aId <= bId -- concurrent operations, compare by ReplicaIds

-- todo: fix that horrible naming
precedes :: VClock -> VClock -> ReplicaId -> Boolean
precedes (VClock receiver) (VClock sender) senderId =
  firstCondition && secondCondition
    where
      firstCondition = (getOrZero senderId receiver) == (getOrZero senderId sender) - 1
      secondCondition = Foldable.all lteExceptSender kvs
      lteExceptSender (T.Tuple k1 v1) = 
        (k1 == senderId) || (lte k1 v1)
      lte k v = v <= (getOrZero k receiver)
      kvs = (Map.toUnfoldable sender) :: L.List (T.Tuple ReplicaId Int)

getOrZero :: ReplicaId -> IntMap ReplicaId -> Int
getOrZero key intmap = fromMaybe 0 (Map.lookup key intmap)

merge :: VClock -> VClock -> VClock
merge = Semilattice.join

asJson :: VClock -> String
asJson (VClock intmap) = JSON.writeJSON object
  where
    object = O.fromFoldable kvs
    kvs = (Map.toUnfoldable intmap) :: L.List (T.Tuple ReplicaId Int)

fromJson :: String -> Either String VClock
fromJson json = case JSON.readJSON json of
  Right (r :: O.Object Int) -> do
    let kvs = (O.toUnfoldable r) :: L.List (T.Tuple ReplicaId Int)
    let m = Map.fromFoldable kvs
    Right (VClock m)
  Left e -> do
    Left (show e)
