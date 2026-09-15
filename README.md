# Sistema de acesso para múltiplos cursos

Projeto estático em HTML, CSS e JavaScript para validar telefones cadastrados e liberar o link do grupo de WhatsApp correspondente ao curso.

## O que foi adaptado

A versão original aceitava somente um curso. Agora o sistema suporta vários cursos, e cada curso possui:

- identificador único (`id`);
- nome exibido ao aluno (`title`);
- descrição opcional;
- link próprio do WhatsApp, protegido no arquivo gerado;
- lista independente de telefones autorizados.

Um mesmo telefone pode estar em cursos diferentes ou em somente um deles. A autorização é sempre verificada dentro do curso selecionado.

## Gerenciamento

Abra `ferramentas/gerador.html` localmente, adicione quantos cursos precisar e informe uma lista de telefones para cada curso. Ao clicar em **Gerar authorized.js**, substitua o arquivo `dados/authorized.js` pelo arquivo baixado.

Os números em texto puro não são gravados no `authorized.js`: somente hashes e dados criptográficos são armazenados.

## Link direto para um curso

Após gerar os cursos, é possível abrir diretamente um deles:

`https://seu-dominio/cursos/?curso=ia-basico`

O valor depois de `curso=` deve ser o `id` cadastrado no gerador.

## Compatibilidade

O aplicativo mantém compatibilidade com o `authorized.js` da versão anterior, que tinha apenas `records`. Isso permite atualizar o código sem perder imediatamente a lista existente. O curso legado será exibido como **Curso atual** até que um novo `authorized.js` multi-curso seja gerado.

## Publicação

Publique toda a pasta em uma hospedagem que sirva os arquivos JavaScript. Não é necessário PHP, banco de dados ou servidor próprio.
