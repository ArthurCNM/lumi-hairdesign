# Lumi Hairdesign

Site institucional responsivo da Lumi Hairdesign em desenvolvimento, salão de beleza em Boa Viagem, Recife. A página apresenta o salão, seus serviços, um depoimento e as informações para agendamento e contato.

## Visualizar o site

Não é necessário instalar dependências nem executar uma etapa de build.

1. Abra `index.html` diretamente em um navegador; ou
2. Para servir os arquivos localmente, abra um terminal nesta pasta e execute:

   ```bash
   python -m http.server 8000
   ```

   Acesse [http://localhost:8000](http://localhost:8000).

## Conteúdo da página

- Apresentação da Lumi Hairdesign e chamada para agendamento.
- Serviços de corte e styling, cor e iluminação, tratamentos e finalização.
- Seção sobre o salão e depoimento de cliente.
- Mapa, endereço, WhatsApp, horário de funcionamento e Instagram.
- Layout adaptável a dispositivos móveis.

## Estrutura

```text
.
├── index.html
├── style.css
├── styles/
│   ├── header.css
│   ├── hero.css
│   ├── sections.css
│   ├── footer.css
│   └── responsive.css
└── assets/
    ├──Imagens
```

O conteúdo e os links estão em `index.html`. Os estilos estão em `style.css` e nos arquivos importados de `styles/`; imagens e logotipos ficam em `assets/`.

## Recursos externos

O site carrega as fontes DM Sans e Playfair Display do Google Fonts, uma imagem de capa do Unsplash e um mapa incorporado do Google Maps. Esses recursos precisam de conexão com a internet para serem exibidos.
