from fastapi import FastAPI

app = FastAPI(title="Victorio ABC AI Wound Classification Service")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-service"}
