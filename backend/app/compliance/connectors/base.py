from abc import ABC, abstractmethod


class ConnectorV1(ABC):
    """
    Abstract Base Class for all versioned government compliance connectors.
    Connectors are strictly stateless.
    """

    @abstractmethod
    def authenticate(self, credentials: dict) -> str:
        """
        Authenticates against the government service and returns a token.
        """
        pass

    @abstractmethod
    def submit(self, payload: dict, token: str) -> dict:
        """
        Submits compliance payload (e.g. generate e-way bill).
        """
        pass

    @abstractmethod
    def cancel(self, document_no: str, reason: str, token: str) -> dict:
        """
        Cancels an already submitted compliance document.
        """
        pass
