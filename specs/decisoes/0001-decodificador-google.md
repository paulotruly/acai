# 0001: uso do decodificador de links do Google Notícias

**Estado:** aceita provisoriamente, pendente de avaliação da orientação.

**Contexto:** o RSS do Google Notícias é a fonte de descoberta de maior volume entre as testadas, mas seus links são codificados. A obtenção da URL real depende de um método não oficial.

**Decisão:** usar o método isolado na função `resolverUrl`, com intervalo de 6 segundos entre itens. Um HTTP 429 encerra a etapa, e falhas acima de 20% a interrompem.

**Consequências:** o método pode deixar de funcionar ou conflitar com os termos de uso. Nesses casos, os metadados são preservados e o conector WordPress passa a ser a alternativa, com volume menor.
