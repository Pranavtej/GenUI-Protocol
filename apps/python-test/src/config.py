from pydantic_settings import BaseSettings
from typing import Literal
import os


class Settings(BaseSettings):
    mcp_base_url: str = "http://localhost:4000"
    llm_provider: Literal["openai", "anthropic"] = "openai"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-20250514"
    max_tokens: int = 4096
    temperature: float = 0.2
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    model_config = {"env_prefix": "genui_", "env_file": ".env", "extra": "ignore"}

    @property
    def resolved_openai_key(self) -> str:
        return self.openai_api_key or os.getenv("OPENAI_API_KEY", "")

    @property
    def resolved_anthropic_key(self) -> str:
        return self.anthropic_api_key or os.getenv("ANTHROPIC_API_KEY", "")

    @property
    def has_credentials(self) -> bool:
        if self.llm_provider == "openai":
            return bool(self.resolved_openai_key)
        return bool(self.resolved_anthropic_key)


settings = Settings()
