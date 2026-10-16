import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from config import MONGODB_URI, DB_NAME, DATA_DIR

class JsonCollection:
    """Embedded JSON file-backed document store mimicking PyMongo collection."""
    def __init__(self, name: str, filepath: Path):
        self.name = name
        self.filepath = filepath
        if not self.filepath.exists():
            self._write([])

    def _read(self) -> List[Dict[str, Any]]:
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _write(self, data: List[Dict[str, Any]]) -> None:
        with open(self.filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)

    def _match(self, doc: Dict[str, Any], filter_doc: Dict[str, Any]) -> bool:
        if not filter_doc:
            return True
        for k, v in filter_doc.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._match(doc, sub) for sub in v):
                    return False
                continue
            if k == "$in" or (isinstance(v, dict) and "$in" in v):
                target_list = v["$in"] if isinstance(v, dict) else v
                if doc.get(k) not in target_list:
                    return False
                continue
            if isinstance(v, dict):
                # Simple operator checks
                doc_val = doc.get(k)
                if "$gte" in v and not (doc_val is not None and doc_val >= v["$gte"]):
                    return False
                if "$lte" in v and not (doc_val is not None and doc_val <= v["$lte"]):
                    return False
                if "$gt" in v and not (doc_val is not None and doc_val > v["$gt"]):
                    return False
                if "$lt" in v and not (doc_val is not None and doc_val < v["$lt"]):
                    return False
                if "$ne" in v and doc_val == v["$ne"]:
                    return False
                continue
            if doc.get(k) != v:
                return False
        return True

    def find(self, filter_doc: Optional[Dict[str, Any]] = None, sort: Optional[List] = None, limit: Optional[int] = None, skip: Optional[int] = None) -> List[Dict[str, Any]]:
        filter_doc = filter_doc or {}
        docs = [d for d in self._read() if self._match(d, filter_doc)]
        if sort:
            for field, direction in reversed(sort):
                reverse = direction < 0
                docs.sort(key=lambda d: (d.get(field) is None, d.get(field)), reverse=reverse)
        if skip:
            docs = docs[skip:]
        if limit:
            docs = docs[:limit]
        return docs

    def find_one(self, filter_doc: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        res = self.find(filter_doc, limit=1)
        return res[0] if res else None

    def insert_one(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        docs = self._read()
        item = dict(doc)
        if "_id" not in item:
            item["_id"] = str(uuid.uuid4())
        docs.append(item)
        self._write(docs)
        return item

    def insert_many(self, new_docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        docs = self._read()
        inserted = []
        for d in new_docs:
            item = dict(d)
            if "_id" not in item:
                item["_id"] = str(uuid.uuid4())
            docs.append(item)
            inserted.append(item)
        self._write(docs)
        return inserted

    def update_one(self, filter_doc: Dict[str, Any], update_doc: Dict[str, Any]) -> bool:
        docs = self._read()
        for idx, doc in enumerate(docs):
            if self._match(doc, filter_doc):
                if "$set" in update_doc:
                    doc.update(update_doc["$set"])
                if "$inc" in update_doc:
                    for ik, iv in update_doc["$inc"].items():
                        doc[ik] = doc.get(ik, 0) + iv
                if "$push" in update_doc:
                    for pk, pv in update_doc["$push"].items():
                        if pk not in doc or not isinstance(doc[pk], list):
                            doc[pk] = []
                        doc[pk].append(pv)
                doc["updated_at"] = datetime.utcnow().isoformat()
                docs[idx] = doc
                self._write(docs)
                return True
        return False

    def delete_one(self, filter_doc: Dict[str, Any]) -> bool:
        docs = self._read()
        for idx, doc in enumerate(docs):
            if self._match(doc, filter_doc):
                docs.pop(idx)
                self._write(docs)
                return True
        return False

    def count_documents(self, filter_doc: Optional[Dict[str, Any]] = None) -> int:
        return len(self.find(filter_doc))


class DatabaseManager:
    def __init__(self):
        self.use_mongo = False
        self.mongo_client = None
        self.mongo_db = None
        self.collections: Dict[str, Any] = {}
        self._init_db()

    def _init_db(self):
        if MONGODB_URI:
            try:
                from pymongo import MongoClient
                client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=1500)
                client.admin.command('ping')
                self.mongo_client = client
                self.mongo_db = client[DB_NAME]
                self.use_mongo = True
                print(f"[Database] Connected to live MongoDB at {MONGODB_URI}")
            except Exception as e:
                print(f"[Database] Live MongoDB connection failed ({e}). Falling back to Embedded JSON Document Store.")
                self.use_mongo = False
        else:
            print("[Database] No MONGODB_URI provided. Using Embedded JSON Document Store.")

        # Initialize collection names from SRS 6.1
        collection_names = ["users", "issues", "verifications", "notifications", "departments", "audit_logs"]
        for name in collection_names:
            if self.use_mongo:
                self.collections[name] = self.mongo_db[name]
            else:
                self.collections[name] = JsonCollection(name, DATA_DIR / f"{name}.json")

    def get_collection(self, name: str):
        return self.collections.get(name)

db_manager = DatabaseManager()

def get_collection(name: str):
    return db_manager.get_collection(name)
