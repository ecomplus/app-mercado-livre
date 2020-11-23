
# [ml](https://github.com/ecomplus/app-mercado-livre/tree/master/functions/public/icon.png)Integração E-com Plus com Mercado Livre

O Aplicativo Mercado Livre tem o objetivo de integrar os anúncios existentes na plataforma E-com Plus com os anúncios do Mercado Livre e também os pedidos feitos no Mercado Livre que possuiem vínculos vão ser integrados.

Antes de iniciar a configuração, leia atentamente as características importantes dessa integração:

### 1- Tratamento do saldo quando venda é feita em boleto no Mercado Livre.

. Quando uma venda é feita no Mercado Livre com a forma de pagamento BOLETO, o **mercado livre não considera baixa de saldo do produto**.
Veja o exemplo abaixo:

1. Tenho produto com 3 unidades de saldo.
2. Algum comprador faz a compra de 2 unidades com boleto.
3. Enquando o boleto não é quitado, o saldo do produto continua 3 no **mercado livre**.
4. Se durante esse período de compensação do boleto, alguém vier e comprar 3 ou 2 unidades com cartão de crédito(a compra é aprovada praticamente simultaneamente), então o produto vai seguir para ser entregue para a segunda pessoa.
5. E o boleto que o primeiro comprador fez? Será revertido para o Mercado pago seguindo as normas da empresa e devolvendo para o usuário.

O que a E-com Plus fez para isso?

* Criamos um **saldo reservado**. Quando é feita uma venda com boleto bancário, na E-com baixa o saldo do produto e a quantidade do boleto vai ficar reservada aguardando o pagamento. Dessa forma, sempre que o saldo for exportado para o Mercado Livre, será considerado o saldo do produto + reservado.

* Seguindo o exemplo acima, vai ficar assim:

1. Saldo total de 3 unidades.
2. Venda de 2 unidades em Boleto no **Mercado livre**.
3. Na E-com o saldo vai ficar 1 + 2 reservado.

____
Seguindo isso, podem ocorrer momentos que o saldo na E-com do produto vai estar menor que no mercado Livre:
Na e-com o saldo vai ser 1 e no mercado livre 3 (os 2 estarão reservados e vão ser baixados com a confirmação do pagamento ou estornados caso o pagamento não seja aprovado).
____

### 2- Categoria do produto no Mercado Livre / Particularidades para cadastro do anúncio.

. O **Mercado Livre** tem uma política de estrutura obrigatória para criar o anúncio. Determinadas categorias tem campos que são obrigatórios. Por exemplo: Calça é obrigatório as variações `tamanho` e `cor`. Se existir calça no cadastro da E-com e não possui essa variação, o anúcio não será enviado, gerando o log de erro mostrando que o campo é obrigatório.

. Assim como existem variações que são obrigatórias para algumas categorias, também existem categorias do **Mercado Livre** que não permitem variação. Se ele não aceitar, o anúncio vai ser criado *desconsiderando* as variações existentes no produto.

. Além de variações obrigatórias ou não, a categoria também determina algumas outras particularidades, como por exemplo o preço. Algumas categorias possuem valor mínimo do produto. Portanto, caso deseje fazer algum teste, não coloque valores pequenos, pois também vão gerar erro no log da exportação e o anúncio não será criado.

. Se o nome do produto for maior que a categoria permite, também será enviado somente a quantidade de caracteres permitidos (desconsiderando sempre o final da descrição).

### 3- Vínculo do produto E-com ao anúncio do Mercado Livre.

. Se você já possui anúncios no mercado livre, basta utilizar a opção de vincular para informar o produto E-com correspondente. Isso fará com que de acordo com a sua confiração, a E-com possa enviar atualizações de preço e saldo por exemplo. Os pedidos gerados no Mercado Livre com esse produto, também serão importados para a plataforma da E-com.

### 4- Anúncio inativo no Mercado Livre.

. O Mercado livre possibilita inativar um anúncio para que paralise venda dele na plataforma. Se o anúncio estiver inativo, a E-com não enviará atualizações de preço, saldo.

### Desvincular produto na E-com.

. Ao acessar a E-com e *desvincular* o produto, ele apenas retira o vńculo da comunicação E-com ➙ Mercado  Livre. O anúncio continua ativo. Se for necessário inativar ou excluir o anúncio, ele deve ser feito diretamente no site do **Mercado Livre**.

### O cliente fez a compra de mais de um produto da minha loja. Porque gerou 2 pedidos na E-com?

. Quando é feito no mesmo tícket de venda 2 produtos diferentes do mesmo anunciante (ou seja: A pessoa adquiriu na mesma compra o produto A e o produto B), o mercado Livre gera 2 pedidos diferentes. Como a E-com apenas importa o pedido, se foram gerados 2, serão importados 2:Cada um com um produto.
. E se eu comprar mais unidades do mesmo produto? Se for o mesmo produto, gera um único pedido.

### Variação de produtos com preço de venda diferente.

. Na E-com é possível ter uma variação com preço diferente das demais. Para ser exportado para o Mercado Livre, se o preço for diferente, vai ser usado o maior preço para **todos** incluídos na variação. Ou seja: Se a cor Azul é 10,00 e a cor vermelho é 12,00. Será aplicado o maior valor (12,00).

### Produto com saldo em branco ou zero gera anúncio *inativo*.

. Se exportar um produto ele não tiver saldo, o **Mercado Livre** automaticamente ao receber o anúncio deixa ele inativo. Somente produtos com saldo vai gerar o anúncio ativo.

### Após enviar um anúncio, quais campos são sempre atualizados?

. A descrição do produto é um exemplo de campo que não é atualizado. Se você enviar um anúncio e deixar ele vinculado à E-com, ao mudar o nome do produto, essa alteração não é enviada. Veja os campos atualizados sempre que houver alteração:
1. Preço de venda (desde que tenha sido configurado).
2. Saldo (desde que tenha sido configurado).
3. Variação.

### Sempre ao enviar um produto será gerado um novo anúncio.

. Mesmo que o produto já esteja vinculado à algum anúncio no **Mercado Livre**, sempre ao exportar, será criado um *novo anúncio*, ou seja: É possível ter o mesmo produto anunciado mais de uma vez (Semopre confira o ID do ML do produto, que pode ser visto pelo painel oferecido pelo site):

[ID no ML](https://github.com/ecomplus/app-mercado-livre/tree/master/functions/public/img/img1.png).

### Produtos que possuem cadastro de kits não são exportados.

. Se o produto esta com Kit habilitado no cadastro dele, não será exportado.

### Campanhas e descontos na E-com Plus.

. Ao exportar o produto, a opção de campanhas e descontos NÃO será considerada para criação do anúncio.Será exportado o produto como esta no cadastro.

### O Mercado livre tem percentual de informações do produto.

. Caso o percentual do produto não seja satisfatório no mercado livre, é necessário acessar o site e preencher manualmente os campos solicitados caso deseje que seu anúncio cumpra 100% dos quesitos. Estamos sempre melhorando as informações exportadas afim de atingir o melhor percentual possível, mas existem categorias que são muito criteriosa e vamos tratando essas particularidades durante as manutenções feitas na plataforma.

#### Configurando o aplicativo:

Após entender as particularidades, vamos à configuração:

1. Instale o aplicativo Mercado Livre acessando o seu painel administrativo da E-com Plus:

**COLOCAR IMAGEM AQUI**

2. Faça a configuração, preenchendo os seus dados de conexão do **Mercado Livre** em Autenticação:


#### Exportando produtos:

Vá na aba Exportar produtos e preencha conforme detalhado abaixo:

[exportar_produto](https://github.com/ecomplus/app-mercado-livre/tree/master/functions/public/img/produto.gif)

#### Vincular produto já existente:

Vá na aba **vincular produto**. Ela serve para vincular um anúncio já existente no **MErcado Livre** ao cadastro da E-com Plus. Após fazer o vínculo, novos pedidos feitos no MErcado Livre com esse produto serão integrados à plataforma E-com Plus. Se você marcar as opções:
1 - Sincronizar saldo: A cada mudança do saldo, será atualizado o saldo no Mercado Livre.
2 - Sincronizar preço: Apśo alterar preço de venda, ele será alterado no Mercado Livre.
3- Se cadastrar nova variação na E-com Plus, ela será integrada.

[vincular_produto](https://github.com/ecomplus/app-mercado-livre/tree/master/functions/public/img/vincular_produto.png)


#### Desvincular produto do Mercado Livre:

Retira o vínculo do produto na E-com Plus ao anúncio do Mercado Livre. Ele não exclui o pedido no Mercado Livre, apenas retira o vínculo. Basta localizar o produto e clicar para *Desvincular*:

[des/vincular_produto](https://github.com/ecomplus/app-mercado-livre/tree/master/functions/public/img/desvincular.png)
