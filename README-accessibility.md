# Melhorias de Acessibilidade e SEO - Tudo Fresco

## Visão Geral

Este documento detalha as melhorias implementadas para aumentar a acessibilidade da aplicação Tudo Fresco e otimizá-la para motores de busca (SEO). Estas melhorias foram projetadas para tornar o site mais acessível para todos os usuários, incluindo aqueles com deficiências, e para melhorar a visibilidade e o ranking nos resultados de pesquisa.

## JSON-LD (Dados Estruturados)

Implementamos JSON-LD na aplicação para fornecer dados estruturados aos motores de busca:

- **Informações da organização**: Nome, URL, logo e descrição
- **Informações do site**: Nome e detalhes do publisher
- **Informações da página web**: Detalhes sobre o conteúdo da página
- **Informações de produtos**: Detalhes sobre os planos de assinatura, incluindo preços e descrições

Estes dados ajudam os motores de busca a entender melhor o conteúdo do site e podem melhorar a apresentação nos resultados de pesquisa com rich snippets.

## Melhorias de SEO

Implementamos várias otimizações para melhorar o SEO:

- **Sistema de metadados centralizado**: Criamos `metadata.ts` para gerenciar todos os metadados do site de forma consistente
- **Meta tags otimizadas**: Título, descrição, palavras-chave e robots
- **OpenGraph e Twitter Cards**: Para melhorar o compartilhamento em redes sociais
- **Links canônicos**: Para evitar problemas de conteúdo duplicado
- **Estrutura de cabeçalhos semântica**: Hierarquia correta de h1-h6 em todas as páginas

## Melhorias de Acessibilidade

Implementamos diversas melhorias de acessibilidade seguindo as diretrizes WCAG:

- **Link "Skip to Content"**: Permite que usuários de teclado e leitores de tela pulem diretamente para o conteúdo principal
- **Atributos ARIA**: Adicionados onde necessário para melhorar a navegação por leitores de tela
- **Labels para formulários**: Todos os campos de formulário possuem labels adequados
- **Contraste de cores**: Garantimos contraste adequado para melhor legibilidade
- **Atributos alt em imagens**: Descrições adequadas para imagens informativas
- **Feedback para estados de erro**: Mensagens de erro são anunciadas para leitores de tela
- **Botões acessíveis**: Componente dedicado com estado de carregamento adequado e indicadores visuais
- **Semântica HTML correta**: Uso apropriado de elementos semânticos como `main`, `section`, `article`, etc.
- **Atributos aria-hidden**: Em elementos decorativos ou que não devem ser anunciados por leitores de tela

## Componentes Acessíveis

Criamos componentes reutilizáveis com acessibilidade em mente:

- **AccessibleButton**: Botão com melhor acessibilidade, incluindo estados de carregamento e ícones
- **SkipToContent**: Componente para pular para o conteúdo principal
- **Formulários aprimorados**: Com labels, validação e feedback de erro acessíveis

## Testes e Validação

Recomendamos realizar os seguintes testes para garantir a acessibilidade e o SEO:

- Teste com leitores de tela (NVDA, JAWS, VoiceOver)
- Navegação por teclado
- Validadores automáticos (Lighthouse, axe, WAVE)
- Validação de Schema.org para os dados estruturados
- Teste de contraste de cores

## Próximos Passos

Para continuar melhorando a acessibilidade e SEO do site:

1. Implementar testes automatizados de acessibilidade
2. Adicionar mais dados estruturados (FAQ, Breadcrumbs, etc.)
3. Realizar testes com usuários reais com deficiências
4. Implementar monitoramento contínuo de acessibilidade
5. Adicionar um mapa do site XML para SEO
