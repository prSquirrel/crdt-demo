module GCounter
  ( GCounter (..)
  , initial
  , increment
  , value
  , merge
  , asJson
  , fromJson
  , IntMap
  , ReplicaId
  ) where

import Data.Tuple (Tuple)

import Data.Foldable as Foldable
import Data.List as L
import Data.Map as Map
import Data.Maybe (fromMaybe)
import Data.Either (Either(..))
import Foreign.Object as O
import Prelude -- (class Semigroup, max, (+), show)
import Semilattice (class Semilattice)
import Semilattice as Semilattice
import Simple.JSON as JSON

type IntMap key = Map.Map key Int
type ReplicaId = String

newtype GCounter = GCounter (IntMap ReplicaId)

initial :: GCounter
initial = GCounter (Map.empty)

increment :: ReplicaId -> GCounter -> GCounter
increment replicaId (GCounter intmap) = GCounter newIncrements
  where
    newIncrements = Map.insert replicaId newValue intmap
    newValue = currentValue + 1
    currentValue = fromMaybe 0 (Map.lookup replicaId intmap)

value :: GCounter -> Int
value (GCounter intmap) = Foldable.sum intmap

merge :: GCounter -> GCounter -> GCounter
merge = Semilattice.join

asJson :: GCounter -> String
asJson (GCounter intmap) = JSON.writeJSON object
  where
    object = O.fromFoldable kvs
    kvs = (Map.toUnfoldable intmap) :: L.List (Tuple ReplicaId Int)

fromJson :: String -> Either String GCounter
fromJson json = case JSON.readJSON json of
  Right (r :: O.Object Int) -> do
    let kvs = (O.toUnfoldable r) :: L.List (Tuple ReplicaId Int)
    let m = Map.fromFoldable kvs
    Right (GCounter m)
  Left e -> do
    Left (show e)

instance semilatticeGCounter :: Semilattice GCounter

instance semigroupGCounter :: Semigroup GCounter where
  append (GCounter a) (GCounter b) = GCounter (Map.unionWith max a b)
