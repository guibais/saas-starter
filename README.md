# Tudo Fresco - Gourmet Fruit Subscription E-commerce Platform

> **Nota importante**: Este projeto utiliza **pnpm** como gerenciador de pacotes. Certifique-se de usar `pnpm` em vez de `npm` ou `yarn` para todas as operações de instalação e execução de scripts.

## Project Overview

Tudo Fresco is a gourmet fruit subscription e-commerce platform where users can select from various subscription plans or purchase individual fruits. Each subscription plan includes fixed items, customizable regular fruits, and exotic fruits within specified limits. The platform also functions as a traditional e-commerce, allowing customers to buy individual fruits without a subscription. The platform features a clean, modern design with a hortifruti aesthetic and uses #103f25 as the primary color. **The entire platform will be implemented in Portuguese language to serve the Brazilian market.**

## Implementation Approach

This project will adapt and extend the existing SaaS starter codebase rather than building everything from scratch. We'll leverage the existing authentication system, admin dashboard structure, and payment integration, modifying them to fit our specific requirements for the gourmet fruit subscription e-commerce platform.

## Implementation Checklist

### 1. Database Schema Updates

- [x] Extend existing database schema with new tables:
  - [x] `products` table
    - Fields: id, name, description, price, image_url, product_type (normal/exotic), stock_quantity, is_available, created_at, updated_at
  - [x] `subscription_plans` table
    - Fields: id, name, description, slug, price, image_url, created_at, updated_at
  - [x] `plan_fixed_items` table
    - Fields: id, plan_id, product_id, quantity, created_at, updated_at
  - [x] `plan_customizable_items` table
    - Fields: id, plan_id, product_type, min_quantity, max_quantity, created_at, updated_at
  - [x] `user_subscriptions` table
    - Fields: id, user_id, plan_id, status, start_date, next_delivery_date, created_at, updated_at
  - [x] `subscription_items` table
    - Fields: id, subscription_id, product_id, quantity, created_at, updated_at
  - [x] `orders` table
    - Fields: id, user_id, status, total_amount, payment_status, shipping_address, delivery_instructions, created_at, updated_at
  - [x] `order_items` table
    - Fields: id, order_id, product_id, quantity, unit_price, total_price, created_at, updated_at
  - [x] `cart` table
    - Fields: id, user_id, created_at, updated_at
  - [x] `cart_items` table
    - Fields: id, cart_id, product_id, quantity, created_at, updated_at
- [x] Modify existing `users` table
  - Add fields: address, phone, delivery_instructions
- [x] Create database relations between all tables
- [x] Update database migration scripts

### 2. Authentication & Authorization

- [x] Adapt existing middleware to handle role-based access control
  - Admin access to dashboard
  - User access to subscription management and order history
- [x] Extend existing user roles to include:
  - Admin user role with full CRUD permissions
  - Customer user role with subscription management and order permissions
- [ ] Translate all authentication messages and emails to Portuguese
- [x] Refactor authentication state management to use Zustand

### 3. Admin Dashboard

- [x] Adapt existing admin layout to include new sections:
  - [x] Product management
  - [x] Subscription plan management
  - [x] Inventory management
  - [x] Order management
- [x] Product Management
  - [x] Create product listing page
  - [x] Implement product creation form
  - [x] Add product edit and deletion functionality
  - [x] Implement stock management features
- [x] Subscription Plan Management
  - [x] Create plan listing page
  - [x] Implement plan creation form with:
    - [x] Basic details (name, description, price, image)
    - [x] Fixed items selection
    - [x] Customizable items configuration (min/max for regular and exotic fruits)
  - [x] Implement plan edit and deletion functionality
- [x] Extend User Management
  - [x] Add subscription and order history to user details view
- [x] Enhance Order/Subscription Management
  - [x] Add subscription management interfaces
  - [x] Create order management dashboard
  - [x] Extend order management with delivery scheduling
- [x] Add Inventory Management
  - [x] Create inventory dashboard with stock levels
  - [x] Implement low stock alerts
  - [x] Create stock adjustment interface
- [x] Create admin dashboard overview with statistics
- [ ] Translate all admin interface text to Portuguese
- [x] Refactor state management to use Zustand for complex state
- [x] Implement Jotai for UI-specific atomic state management

### 4. Customer-Facing Pages

- [x] Homepage
  - [x] Adapt existing landing page with hortifruti aesthetic
  - [x] Add featured subscription plans and products sections
  - [x] Create how it works section
  - [x] Add testimonials section
  - [x] Implement benefits section highlighting key features
  - [x] Create call-to-action sections for subscription sign-up
  - [x] Integrate with API for dynamic content loading
  - [x] Create responsive header and footer components
  - [x] Implement theme configuration with primary color
- [ ] Product Catalog
  - [x] Create product listing with filters
  - [x] Implement search functionality
  - [x] Add sorting options
  - [x] Create category navigation
  - [x] Use Jotai for filter and search state management
- [ ] Product Detail
  - [x] Create product detail page with images
  - [x] Implement add to cart functionality
  - [x] Add quantity selector
  - [x] Show related products
- [x] Shopping Cart
  - [x] Implement cart summary
  - [x] Add item quantity adjustment
  - [x] Create remove items functionality
  - [x] Add proceed to checkout button
  - [x] Implement cart state management with Zustand
- [ ] Subscription Plan Listing
  - [x] Create card view of available plans
  - [x] Implement plan comparison table
- [ ] Subscription Plan Detail
  - [x] Create plan information page with images
  - [x] Display fixed items
  - [x] Implement customizable items selection interface
  - [x] Add subscription checkout button
  - [x] Use Zustand for managing customization state
- [x] User Dashboard
  - [x] Extend existing dashboard with subscription details
  - [x] Add upcoming delivery information
  - [x] Implement subscription management controls
  - [x] Display order history for individual purchases
  - [x] Add address management
- [x] Checkout Flow
  - [x] Adapt existing checkout for both subscriptions and individual purchases
  - [x] Implement plan selection confirmation for subscriptions
  - [x] Add customizable items selection for subscriptions
  - [x] Create cart review for individual purchases
  - [x] Extend delivery information collection
  - [x] Use Zustand for checkout state management
- [ ] Translate all customer-facing text to Portuguese

### 5. Image Management

- [x] Configure Supabase storage for image uploads
  - [x] Set up storage buckets and policies
- [x] Create image upload component
  - [x] Implement image cropping functionality
  - [x] Add image optimization
  - [x] Use Jotai for image editor state
- [x] Integrate image management in product and plan forms
- [ ] Translate all image upload interfaces and error messages to Portuguese

### 6. Payment Integration

- [x] Adapt existing Stripe integration for both one-time and subscription-based payments
  - [x] Configure subscription products in Stripe
  - [x] Configure one-time purchase products in Stripe
  - [x] Extend webhook handlers for all payment events
- [x] Modify existing checkout flow to support:
  - [x] Subscription payments
  - [x] One-time purchases
- [x] Implement subscription management
  - [x] Upgrades/downgrades
  - [x] Cancellations
  - [x] Pauses
- [x] Add support for Brazilian payment methods (PIX, Boleto, credit cards)
- [ ] Translate all payment-related text and notifications to Portuguese
- [x] Refactor payment flow state management to use Zustand

## Stripe Integration Details

### Overview

The platform integrates with Stripe for payment processing, supporting both one-time purchases and subscription-based payments. The integration is designed to handle Brazilian payment methods including credit cards, PIX, and Boleto.

### Key Components

1. **Product Configuration**

   - Each product in the database has corresponding `stripeProductId` and `stripePriceId` fields
   - Subscription plans are configured with `stripeProductId` and `stripePriceId` for recurring billing

2. **Checkout Process**

   - One-time purchases: Users can add products to cart and proceed to checkout
   - Subscription purchases: Users select a plan and customize their subscription before checkout
   - Both flows redirect to Stripe Checkout for secure payment processing

3. **Payment Methods**

   - Credit Card: Standard credit card processing
   - PIX: Instant Brazilian payment method
   - Boleto: Brazilian payment slip system

4. **Webhook Handling**

   - Checkout session completed: Processes successful payments
   - Subscription updated: Handles changes to subscriptions
   - Payment failed: Manages failed payment attempts

5. **Customer Portal**
   - Allows customers to manage their subscription
   - Update payment methods
   - View billing history

### Implementation Files

- `lib/payments/stripe.ts`: Core Stripe utility functions
- `app/api/stripe/checkout/create/route.ts`: API endpoint for one-time purchases
- `app/api/stripe/checkout/subscription/create/route.ts`: API endpoint for subscription purchases
- `app/api/stripe/checkout/subscription/route.ts`: API endpoint for processing subscription success
- `app/api/stripe/webhook/route.ts`: Webhook handler for Stripe events

### State Management

The checkout process uses Zustand stores for state management:

- `useCartStore`: Manages shopping cart items for one-time purchases
- `usePaymentStore`: Handles payment method selection and checkout processing
- `useSubscriptionStore`: Manages subscription plan selection and customization

### 7. UI/UX Implementation

- [x] Create custom theme with primary color #103f25
  - [x] Define color palette
  - [x] Implement typography system with support for Portuguese characters
  - [x] Style components with hortifruti aesthetic
- [x] Extend existing UI components
  - [x] Create/adapt UI components (buttons, inputs, cards, tables, dropdowns)
  - [x] Create product cards with image, description, and price
  - [x] Design plan selection cards
  - [x] Implement shopping cart components
- [x] Ensure responsive design
  - [x] Test and optimize for mobile devices
  - [x] Verify tablet and desktop layouts
- [x] Implement product filtering and sorting UI
  - [x] Use Jotai for filter state management
- [ ] Translate all UI text, placeholders, and labels to Portuguese
- [x] Use Jotai for UI component state (modals, dropdowns, toggles)

### 8. Content Management

- [x] Implement WYSIWYG editor component for rich text descriptions
  - [x] Enable for product descriptions
  - [x] Enable for plan descriptions
  - [x] Use Jotai for editor state management
- [x] Set up content storage and retrieval
- [x] Create product categorization system
- [ ] Configure text editor with Portuguese spell-checking and language support

### 9. Email Notifications

- [x] Adapt existing email system
  - [x] Create templates for welcome email
  - [x] Add subscription confirmation emails
  - [x] Implement order confirmation emails
  - [x] Add shipping confirmation emails
  - [x] Create upcoming delivery notification emails
  - [x] Implement delivery confirmation emails
- [x] Configure email sending service
- [ ] Translate all email templates to Portuguese

### 10. Testing

- [ ] Unit tests for core functionality
  - [ ] Database queries
  - [ ] Business logic
  - [ ] Cart and checkout logic
  - [ ] Zustand and Jotai store tests
- [ ] Integration tests
  - [ ] API endpoints
  - [ ] Authentication flows
  - [ ] Payment processing
  - [ ] State management integration
- [ ] End-to-end tests
  - [ ] User subscription flow
  - [ ] Individual product purchase flow
  - [ ] Admin management flows
- [ ] Language and localization testing
  - [ ] Verify all text is correctly displayed in Portuguese
  - [ ] Test special characters and accents
  - [ ] Validate date and currency formats for Brazilian standards

### 11. Deployment

- [x] Update production environment configuration
  - [x] Set environment variables
  - [x] Run database migrations
- [x] Maintain existing CI/CD pipeline
  - [x] Ensure automated testing covers new functionality
  - [x] Verify deployment process
- [ ] Configure server timezone for Brazil
- [ ] Set up proper locale settings for Portuguese language

### 12. Documentation

- [x] Update API documentation
  - [x] Document new endpoints
  - [x] Provide request/response examples
- [x] Create admin user guide
  - [x] Document product management
  - [x] Explain subscription management
  - [x] Detail order management
- [x] Write customer user guide
  - [x] Explain subscription selection
  - [x] Document individual product purchasing
  - [x] Detail account management
- [ ] Translate all documentation to Portuguese
- [x] Document state management architecture with Zustand and Jotai

### 13. Integração de Dados

- [x] Integração com API para gerenciamento de produtos
  - [x] Listagem de produtos
  - [x] Criação, edição e exclusão de produtos
  - [x] Upload de imagens
- [x] Integração com API para gerenciamento de planos
  - [x] Listagem de planos
  - [x] Criação, edição e exclusão de planos
  - [x] Configuração de itens fixos e regras de customização
- [x] Integração com API para gerenciamento de usuários
  - [x] Autenticação e autorização
  - [x] Perfil de usuário
  - [x] Gerenciamento de equipes
- [x] Integração com API para gerenciamento de assinaturas
  - [x] Listagem de assinaturas
  - [x] Detalhes da assinatura
  - [x] Atualização de status
- [x] Integração com API para gerenciamento de pedidos
  - [x] Listagem de pedidos
  - [x] Detalhes do pedido
  - [x] Atualização de status
- [ ] Integração do dashboard com dados reais
  - [ ] Métricas de vendas
  - [ ] Métricas de assinaturas
  - [ ] Gráficos e visualizações

## Páginas Voltadas para o Cliente

- [x] Página inicial (Homepage)
  - [x] Design com estética de hortifruti
  - [x] Seção de planos de assinatura em destaque
  - [x] Seção de produtos em destaque
  - [x] Seção "Como Funciona"
  - [x] Seção de depoimentos de clientes
  - [x] Seção de benefícios
  - [x] Chamadas para ação estratégicas
  - [x] Cabeçalho e rodapé responsivos
  - [x] Integração com APIs para conteúdo dinâmico
- [x] Página de listagem de planos
  - [x] Exibição de planos disponíveis
  - [x] Comparação entre planos
- [x] Página de detalhes do plano
  - [x] Visualização de itens incluídos
  - [x] Personalização de itens customizáveis
- [x] Página de checkout para assinaturas
  - [x] Formulário de informações de entrega
  - [x] Resumo do pedido
- [x] Página de confirmação de assinatura
  - [x] Detalhes da assinatura criada
  - [x] Próximos passos
- [x] Página de listagem de pedidos
  - [x] Visualização de todos os pedidos do usuário
  - [x] Filtragem e busca de pedidos
  - [x] Status visual dos pedidos
- [x] Página de detalhes do pedido
  - [x] Informações completas do pedido
  - [x] Itens incluídos no pedido
  - [x] Status de entrega e pagamento

## Integração de Pagamentos

- [x] Implementação do fluxo de checkout
  - [x] Validação de dados do cliente
  - [x] Processamento da assinatura
  - [x] Integração com a API de assinaturas existente
  - [x] Atualização de estoque automática
- [x] Integração com gateway de pagamento
  - [x] Configuração do Stripe (simulado)
  - [x] Processamento de pagamentos
  - [x] Webhooks para atualização de status

## Technical Architecture

### Frontend

- Next.js with App Router (existing)
- Tailwind CSS with custom theme (extending existing)
- React components for UI (extending existing)
- Form handling with React Hook Form (existing)
- State management:
  - Zustand for global and complex state (cart, authentication, checkout flow)
  - Jotai for local UI state and atomic state management (form fields, toggles, modals)
- Shopping cart management with Zustand and local storage synchronization
- Internationalization setup with Portuguese as the default language

### Backend

- Next.js API routes (existing)
- Drizzle ORM for database operations (existing)
- Supabase for image storage (new integration)
- Stripe for payment processing (extending existing)
- Email service integration (extending existing)
- Inventory management system (new)
- Localization configuration for Portuguese language and Brazilian formats

### Database

- PostgreSQL with extended schema (existing with modifications):
  - Users and authentication (existing)
  - Products and categories (new)
  - Subscription plans and configurations (new)
  - User subscriptions and orders (new)
  - Shopping cart and order items (new)
- Database collation configured for Portuguese language support

## State Management Strategy

- **Zustand**: Used for global state that needs to be accessed across multiple components

  - Shopping cart state
  - User authentication state
  - Checkout flow state
  - Admin dashboard state
  - Subscription customization state

- **Jotai**: Used for atomic state management within components or small component trees
  - Form field states
  - UI component states (modals, dropdowns, toggles)
  - Filter and search states
  - Image editor state
  - WYSIWYG editor state

## Development Principles

- **DRY (Don't Repeat Yourself)**: Create reusable components and utilities
- **KISS (Keep It Simple, Stupid)**: Maintain simplicity in implementation
- **Clean Code**: Follow consistent naming conventions, proper error handling, and code organization
- **Localization First**: Design with Portuguese language in mind from the beginning
- **Atomic State Management**: Use the right state management tool for each use case
- **Leverage Existing Code**: Adapt and extend existing functionality rather than rebuilding

This implementation plan provides a comprehensive roadmap for adapting the existing SaaS starter into a dual-purpose e-commerce platform that offers both subscription-based and individual fruit purchases. By leveraging the existing codebase and extending it with new features, we can efficiently create a modern, user-friendly platform that serves the Brazilian market effectively, with Zustand and Jotai providing efficient state management solutions.

## Configuração do Cloudflare R2 para Armazenamento de Imagens

Para utilizar o Cloudflare R2 como solução de armazenamento de imagens, siga estas etapas:

1. Crie uma conta no Cloudflare e ative o serviço R2
2. Crie os seguintes buckets:

   - `products` - Para imagens de produtos
   - `plans` - Para imagens dos planos
   - `profiles` - Para imagens de perfil

3. Configure as variáveis de ambiente:

   ```
   CLOUDFLARE_ACCOUNT_ID=seu-account-id
   R2_ACCESS_KEY_ID=sua-access-key
   R2_SECRET_ACCESS_KEY=sua-secret-key
   R2_PUBLIC_URL=https://seu-bucket-publico.r2.dev
   ```

4. Para tornar os buckets públicos (opcional, mas recomendado para imagens):
   - Acesse o painel do Cloudflare
   - Vá para R2 > Buckets
   - Selecione o bucket
   - Clique em "Settings" > "Public Access"
   - Ative "Set bucket as public"
   - Copie o URL público e use-o como `R2_PUBLIC_URL` nas variáveis de ambiente
5. Alternativa: Configurar um domínio personalizado com o Cloudflare
   - Configure um domínio personalizado para apontar para seus buckets R2
   - Use esse domínio como base para o `R2_PUBLIC_URL`

O R2 foi configurado como alternativa ao Supabase Storage por oferecer:

- Melhor desempenho global
- Integrações nativas com o Cloudflare CDN
- Compatibilidade com a API S3 da AWS
- Preços mais acessíveis para tráfego de saída
