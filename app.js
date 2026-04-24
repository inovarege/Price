// Formatar moeda
const footerHTML = `
  <div class="pdf-footer" style="position: static; margin: 2rem 0 0; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.75rem; opacity: 0.6; color: inherit;">
    Desenvolvido por Inovare Gestão Estratégica | com Google Antigravity | para Ambiens Consultoria Ambiental
  </div>
`;

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Formatar contábil simples (ex: 1.000,00 sem R$)
window.formatAccounting = (value) => {
  if (!value) return "0,00";
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

// Parser robusto de inputs textuais numéricos do usuário
window.parseInputNumber = (str) => {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  str = str.toString().trim();
  
  if (str.includes('.') && str.includes(',')) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
  } else if (str.includes(',')) {
    return parseFloat(str.replace(',', '.'));
  } else if (str.includes('.')) {
    if (str.split('.').length > 2) return parseFloat(str.replace(/\./g, ''));
    return parseFloat(str);
  }
  return parseFloat(str) || 0;
};

// Inicializar ícones do Lucide
lucide.createIcons();

// Dados de Despesas Diretas
const expenseCategories = [
  { id: 'terceiros', name: 'Serviços Terceirizados', items: [{ desc: '', qty: 1, val: 0 }], isOpen: false },
  { id: 'logistica', name: 'Despesas Logísticas', items: [{ desc: '', qty: 1, val: 0 }], isOpen: false },
  { id: 'internas', name: 'Horas Internas Ambiens', items: [{ desc: 'Custo hora - Ambiens', qty: 1, val: 92 }], isOpen: false },
  { id: 'outras', name: 'Outras Despesas', items: [{ desc: '', qty: 1, val: 0 }], isOpen: false }
];

window.toggleAccordion = (catIndex) => {
  expenseCategories[catIndex].isOpen = !expenseCategories[catIndex].isOpen;
  renderExpenses();
};

// Estado da Aplicação
const appState = {
  directExpenses: 0,
  categoryTotals: { terceiros: 0, logistica: 0, internas: 0, outras: 0 },
  taxRate: 16.33,
  finRate: 0,
  comRate: 0,
  contRate: 0,
  profitMargin: 30,
  closedPrice: 0,
  suggestedPrice: 0
};

// Renderizar Accordions
function renderExpenses() {
  const container = document.getElementById('expenses-container');
  container.innerHTML = '';
  
  let totalDirect = 0;

  expenseCategories.forEach((cat, catIndex) => {
    let catTotal = cat.items.reduce((acc, item) => acc + (item.qty * item.val), 0);
    appState.categoryTotals[cat.id] = catTotal;
    totalDirect += catTotal;

    const accHTML = `
      <div class="accordion ${cat.isOpen ? 'active' : ''}" id="acc-${cat.id}" style="border-left: 4px solid var(--color-green-primary);">
        <div class="accordion-header" onclick="toggleAccordion(${catIndex})" style="background: rgba(5, 79, 49, 0.08); color: var(--color-green-dark);">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700;">
            ${cat.name} 
            <span style="color: var(--color-green-primary); font-size: 1rem; font-weight: 800;">[ ${cat.isOpen ? '-' : '+'} ]</span>
          </div>
          <div class="accordion-total" style="color: var(--color-green-primary); font-weight: 800; font-size: 1.1rem;">${formatCurrency(catTotal)}</div>
        </div>
        <div class="accordion-body" style="background: #fafdfa;">
          <div style="display: grid; grid-template-columns: 1fr 100px 160px 160px 34px; gap: 1rem; margin-bottom: 0.5rem; font-weight: 700; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">
             <div style="text-align: left;">Descrição</div>
             <div style="text-align: center;">Qtd</div>
             <div style="text-align: center;">${cat.id === 'internas' ? 'Custo Hora' : 'V. Unit'}</div>
             <div style="text-align: right; padding-right: 1.5rem;">Total</div>
             <div></div>
          </div>
          <div id="items-${cat.id}">
            ${cat.items.map((item, itemIdx) => `
              <div class="expense-row" style="display: grid; grid-template-columns: 1fr 100px 160px 160px 34px; gap: 1rem; align-items: center; margin-bottom: 1rem;">
                 <input type="text" class="form-control" value="${item.desc}" placeholder="Descrição do item..." onchange="updateItem(${catIndex}, ${itemIdx}, 'desc', this.value)" style="background: white;">
                 <input type="number" class="form-control" value="${item.qty}" min="0" step="1" onchange="updateItem(${catIndex}, ${itemIdx}, 'qty', this.value)" style="text-align: center; background: white;">
                 <div class="input-with-symbol">
                    <span class="symbol">R$</span>
                    <input type="text" class="form-control" value="${formatAccounting(item.val)}" onfocus="this.value = ${item.val ? `'${item.val}'.replace('.', ',')` : "''"}" onblur="updateItem(${catIndex}, ${itemIdx}, 'val', this.value)" style="text-align: right; background: white;">
                 </div>
                 <div style="font-weight: 800; text-align: right; padding-right: 0.5rem; color: #1e293b; font-size: 0.95rem;">${formatCurrency(item.qty * item.val)}</div>
                 <button class="btn-icon" onclick="removeItem(${catIndex}, ${itemIdx})" title="Remover" style="padding: 0.35rem; color: #94a3b8;"><i data-lucide="trash-2" style="width: 20px; height: 20px;"></i></button>
              </div>
            `).join('')}
          </div>
          <div style="margin-top: 1rem;">
            <button style="background: transparent; border: none; color: var(--color-green-primary); font-weight: 800; font-size: 0.9rem; cursor: pointer; padding: 0;" onclick="addItem(${catIndex})">
              Adicionar Item
            </button>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', accHTML);
  });

  // Atualizar total e cor de fundo como a Imagem pede (verde claro sólido com texto verde escuro)
  const totalRow = document.getElementById('total-direct-expenses').parentNode;
  totalRow.style.background = 'rgba(5, 79, 49, 0.2)';
  totalRow.querySelector('span').style.color = 'var(--color-green-dark)';
  document.getElementById('total-direct-expenses').style.color = 'var(--color-green-dark)';
  document.getElementById('total-direct-expenses').textContent = formatCurrency(totalDirect);
  appState.directExpenses = totalDirect;
  lucide.createIcons();
  
  calculatePricing();
}

window.addItem = (catIndex) => {
  expenseCategories[catIndex].items.push({ desc: '', qty: 1, val: 0 });
  expenseCategories[catIndex].isOpen = true;
  renderExpenses();
};

window.removeItem = (catIndex, itemIdx) => {
  expenseCategories[catIndex].items.splice(itemIdx, 1);
  renderExpenses();
};

window.updateItem = (catIndex, itemIdx, field, value) => {
  if(field === 'qty') expenseCategories[catIndex].items[itemIdx].qty = parseInt(value) || 0;
  else if(field === 'val') expenseCategories[catIndex].items[itemIdx].val = parseInputNumber(value);
  else expenseCategories[catIndex].items[itemIdx].desc = value;
  
  if (field !== 'desc') renderExpenses();
};

// Listeners para taxas
['rate-tax', 'rate-financial', 'rate-commission', 'rate-contingency', 'rate-profit'].forEach(id => {
  document.getElementById(id).addEventListener('input', (e) => {
    let val = parseFloat(e.target.value) || 0;
    if(id === 'rate-tax') appState.taxRate = val;
    else if(id === 'rate-financial') appState.finRate = val;
    else if(id === 'rate-commission') appState.comRate = val;
    else if(id === 'rate-contingency') appState.contRate = val;
    else if(id === 'rate-profit') appState.profitMargin = val;
    
    calculatePricing();
  });
});

// Listener Especial - Preço Fechado com formatação PT-BR
const closedPriceInput = document.getElementById('closed-price');
closedPriceInput.addEventListener('focus', (e) => {
  if (appState.closedPrice > 0) {
    e.target.value = appState.closedPrice.toString().replace('.', ',');
  } else {
    e.target.value = '';
  }
});
closedPriceInput.addEventListener('blur', (e) => {
  appState.closedPrice = parseInputNumber(e.target.value);
  e.target.value = formatAccounting(appState.closedPrice);
  calculatePricing();
});
closedPriceInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') closedPriceInput.blur();
});

function calculatePricing() {
  const variableRateTotal = (appState.taxRate + appState.finRate + appState.comRate + appState.contRate) / 100;
  const marginDes = appState.profitMargin / 100;
  
  // Sugerido
  let denom = 1 - variableRateTotal - marginDes;
  let suggested = 0;
  if (denom > 0) {
    suggested = appState.directExpenses / denom;
  }
  appState.suggestedPrice = suggested;
  const suggestedEl = document.getElementById('suggested-price');
  suggestedEl.textContent = formatCurrency(suggested);
  
  // Ajuste de tamanho de fonte para valores > 1mi
  if (suggested >= 1000000) {
    suggestedEl.style.setProperty('font-size', '1.4rem', 'important');
  } else {
    suggestedEl.style.setProperty('font-size', '2rem', 'important');
  }
  
  // Detalhes Sugerido
  const sugVarTotal = suggested * variableRateTotal;
  const sugLucro = suggested * marginDes;

  const formatPercentStr = (value) => `(${new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(value)})`; 

  const renderLine = (label, val, pct, isBold=false, isSub=false) => `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; ${isBold ? 'font-weight: 700;' : ''} ${isSub ? 'padding-left: 1rem; opacity: 0.75; font-size: 0.8rem;' : 'font-size: 0.9rem;'}">
       <span style="flex: 1; padding-right: 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${label}</span>
       <span style="text-align: right; white-space: nowrap;">${formatCurrency(val)}</span>
       <span style="text-align: right; width: 65px; white-space: nowrap; margin-left: 0.5rem;">${formatPercentStr(pct)}</span>
    </div>
  `;

  // percentages relative to suggested
  const pctDirect = suggested > 0 ? (appState.directExpenses / suggested) : 0;
  const pctVar = suggested > 0 ? (sugVarTotal / suggested) : 0;

  document.getElementById('suggested-details').innerHTML = `
    <div style="color: white; font-size: 0.85rem; font-weight: 800; letter-spacing: 0.1em; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; margin-bottom: 1rem; text-transform: uppercase;">DISTRIBUIÇÃO</div>
    
    ${renderLine('Custos Diretos Totais', appState.directExpenses, pctDirect, true)}
    ${renderLine('Terceirizados', appState.categoryTotals.terceiros || 0, suggested > 0 ? ((appState.categoryTotals.terceiros || 0) / suggested) : 0, false, true)}
    ${renderLine('Logística', appState.categoryTotals.logistica || 0, suggested > 0 ? ((appState.categoryTotals.logistica || 0) / suggested) : 0, false, true)}
    ${renderLine('Horas Internas', appState.categoryTotals.internas || 0, suggested > 0 ? ((appState.categoryTotals.internas || 0) / suggested) : 0, false, true)}
    ${renderLine('Outras Desp.', appState.categoryTotals.outras || 0, suggested > 0 ? ((appState.categoryTotals.outras || 0) / suggested) : 0, false, true)}

    ${renderLine('Total Desp. Variáveis', sugVarTotal, pctVar, true)}
    ${renderLine(`Impostos (${appState.taxRate}%)`, suggested * (appState.taxRate/100), appState.taxRate/100, false, true)}
    ${renderLine(`Financeiras (${appState.finRate}%)`, suggested * (appState.finRate/100), appState.finRate/100, false, true)}
    ${renderLine(`Comissões (${appState.comRate}%)`, suggested * (appState.comRate/100), appState.comRate/100, false, true)}
    ${renderLine(`Imprevistos (${appState.contRate}%)`, suggested * (appState.contRate/100), appState.contRate/100, false, true)}

    <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 1.5rem; padding-top: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; color: white; font-weight: 800; font-size: 1.25rem; text-transform: uppercase;">
         <span>LUCRO PREVISTO</span>
         <div>
            <span style="margin-right: 0.5rem;">${formatCurrency(sugLucro)}</span>
            <span>(${new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(appState.profitMargin/100)})</span>
         </div>
      </div>
    </div>
  `;

  // Fechado
  let closed = appState.closedPrice;
  const closedEl = document.getElementById('closed-price-display');
  closedEl.textContent = formatCurrency(closed);
  
  // Ajuste de tamanho de fonte para valores > 1mi
  if (closed >= 1000000) {
    closedEl.style.setProperty('font-size', '1.4rem', 'important');
  } else {
    closedEl.style.setProperty('font-size', '2rem', 'important');
  }
  
  if (closed > 0) {
    document.getElementById('card-closed').classList.remove('hidden');
    let closedVarTotal = closed * variableRateTotal;
    let closedLucro = closed - appState.directExpenses - closedVarTotal;
    let closedMarginPerc = closed > 0 ? (closedLucro / closed) : 0;
    
    const statusCard = document.getElementById('closed-status-card');
    statusCard.className = 'margin-status-card'; // reset
    
    if (closedMarginPerc <= 0.05) {
      statusCard.classList.add('status-red');
    } else if (closedMarginPerc <= 0.12) {
      statusCard.classList.add('status-yellow');
    } else {
      statusCard.classList.add('status-green');
    }
    
    const cpctDirect = closed > 0 ? (appState.directExpenses / closed) : 0;
    const cpctVar = closed > 0 ? (closedVarTotal / closed) : 0;

    document.getElementById('closed-details').innerHTML = `
      <div style="font-size: 0.85rem; font-weight: 800; letter-spacing: 0.1em; border-bottom: 1px solid currentColor; opacity: 0.8; padding-bottom: 0.5rem; margin-bottom: 1rem; text-transform: uppercase;">DISTRIBUIÇÃO REAL</div>
      
      ${renderLine('Custos Diretos Totais', appState.directExpenses, cpctDirect, true)}
      ${renderLine('Terceirizados', appState.categoryTotals.terceiros || 0, closed > 0 ? ((appState.categoryTotals.terceiros || 0) / closed) : 0, false, true)}
      ${renderLine('Logística', appState.categoryTotals.logistica || 0, closed > 0 ? ((appState.categoryTotals.logistica || 0) / closed) : 0, false, true)}
      ${renderLine('Horas Internas', appState.categoryTotals.internas || 0, closed > 0 ? ((appState.categoryTotals.internas || 0) / closed) : 0, false, true)}
      ${renderLine('Outras Desp.', appState.categoryTotals.outras || 0, closed > 0 ? ((appState.categoryTotals.outras || 0) / closed) : 0, false, true)}

      ${renderLine('Total Desp. Variáveis', closedVarTotal, cpctVar, true)}
      ${renderLine(`Impostos (${appState.taxRate}%)`, closed * (appState.taxRate/100), appState.taxRate/100, false, true)}
      ${renderLine(`Financeiras (${appState.finRate}%)`, closed * (appState.finRate/100), appState.finRate/100, false, true)}
      ${renderLine(`Comissões (${appState.comRate}%)`, closed * (appState.comRate/100), appState.comRate/100, false, true)}
      ${renderLine(`Imprevistos (${appState.contRate}%)`, closed * (appState.contRate/100), appState.contRate/100, false, true)}

      <div style="border-top: 1px solid currentColor; margin-top: 1.5rem; padding-top: 1.5rem; opacity: 0.9;">
        <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 1.25rem; text-transform: uppercase;">
           <span>LUCRO REAL</span>
           <div>
              <span style="margin-right: 0.5rem;">${formatCurrency(closedLucro)}</span>
              <span>${formatPercentStr(closedMarginPerc)}</span>
           </div>
        </div>
      </div>
    `;
  } else {
    document.getElementById('card-closed').classList.add('hidden');
  }
}

// Inicialização
const today = new Date().toISOString().split('T')[0];
document.getElementById('proj-date').value = today;

renderExpenses();
calculatePricing();

// --- PDF EXPORT LOGIC ---
document.getElementById('btn-export-pdf').addEventListener('click', async () => {
   const loading = document.getElementById('loading');
   loading.classList.remove('hidden');

   try {
     const projCode = document.getElementById('proj-code').value.trim();
     const projName = document.getElementById('proj-name').value.trim();
     const projDate = document.getElementById('proj-date').value;
     
     // Formatar data para DD-MM-YYYY
     let formattedDate = '';
     if (projDate) {
       const [y, m, d] = projDate.split('-');
       formattedDate = `${d}-${m}-${y}`;
     } else {
       formattedDate = 'SemData';
     }

     // Nome do Arquivo: Código - Nome - Data
     const baseFileName = `${projCode || 'SemCodigo'} - ${projName || 'Projeto'} - ${formattedDate}`;
     const fileName = baseFileName.replace(/[/\\?%*:|"<>\\]/g, '-');

     // We will build the DOM structure for PDF
     const pdfContainer = document.getElementById('pdf-container');
     
     // Extrair variaveis globais e calcular para impressão
     const dExp = appState.directExpenses;
     const rates = appState.taxRate + appState.finRate + appState.comRate + appState.contRate;
     const sPrice = appState.suggestedPrice;
     const cPrice = appState.closedPrice;

     // Pg 1 - Capa
     const page1HTML = `
      <div class="pdf-page" id="pdf-page-1">
        <div class="pdf-cover">
           <div class="pdf-cover-content">
              <h1 class="pdf-title">Proposta Comercial<br>Formação de Preços</h1>
              
              <div class="pdf-info-group">
                 <div class="pdf-info-label">Nome do Projeto</div>
                 <div class="pdf-info-value">${projName || '-'}</div>
              </div>
              <div class="pdf-info-group">
                 <div class="pdf-info-label">Cliente</div>
                 <div class="pdf-info-value">${document.getElementById('proj-client').value || '-'}</div>
              </div>
              <div class="pdf-info-group">
                 <div class="pdf-info-label">Código da Proposta</div>
                 <div class="pdf-info-value">${projCode || '-'}</div>
              </div>
              <div class="pdf-info-group">
                 <div class="pdf-info-label">Data</div>
                 <div class="pdf-info-value">${formattedDate}</div>
              </div>
              <div class="pdf-info-group" style="margin-top: 3rem;">
                 <div class="pdf-info-label">Descrição</div>
                 <div style="font-size: 1.1rem; color: #555; max-width: 80%;">${document.getElementById('proj-desc').value || '-'}</div>
              </div>
           </div>
        </div>
        ${footerHTML}
      </div>
     `;

     // Pg 2 - Detalhamento Financeiro
     const getPriceFontSize = (price) => (price >= 1000000 ? '1.8rem' : '2.2rem');
     
     const page2HTML = `
      <div class="pdf-page" id="pdf-page-2">
         <style>
            #pdf-page-2 span { white-space: nowrap !important; }
            #pdf-page-2 .pdf-details-row span:first-child { 
               white-space: normal !important; 
               text-overflow: clip !important; 
               overflow: visible !important; 
               max-width: 160px;
            }
         </style>
         <h2 style="color: #054F31; font-size: 1.8rem; border-bottom: 2px solid #054F31; padding-bottom: 0.5rem; margin-bottom: 1.5rem;">Detalhamento Financeiro</h2>
         
         <div style="display: flex; gap: 1rem;">
            <!-- Fechado -->
            <div style="flex: 1; padding: 1.2rem; border: 2px solid #F2DE2B; border-radius: 12px; background: #fffdf5; display: flex; flex-direction: column;">
               <h3 style="color: #054F31; text-align: center; margin-bottom: 0.5rem; font-size: 1rem;">Cenário Fechado</h3>
               <div style="text-align: center; font-size: ${getPriceFontSize(cPrice)}; font-weight: 800; color: #054F31; margin-bottom: 1.5rem; letter-spacing: -0.02em;">${formatCurrency(cPrice)}</div>
               
               <div class="pdf-details-row" style="font-size: 0.8rem;">
                  ${document.getElementById('closed-details').innerHTML || '<p style="text-align:center; color:#888;">Nenhum dado informado</p>'}
               </div>
            </div>
            
            <!-- Sugerido -->
            <div style="flex: 1; padding: 1.2rem; border: 2px solid #6096BA; border-radius: 12px; background: #f0f7f9; display: flex; flex-direction: column;">
               <h3 style="color: #054F31; text-align: center; margin-bottom: 0.5rem; font-size: 1rem;">Cenário Sugerido</h3>
               <div style="text-align: center; font-size: ${getPriceFontSize(sPrice)}; font-weight: 800; color: #054F31; margin-bottom: 1.5rem; letter-spacing: -0.02em;">${formatCurrency(sPrice)}</div>
               
               <div class="pdf-details-row" style="font-size: 0.8rem;">
                  ${document.getElementById('suggested-details').innerHTML}
               </div>
            </div>
         </div>
         
         <h3 style="margin-top: 2rem; color: #054F31; font-size: 1.2rem;">Base de Despesas Diretas Reais</h3>
         <table style="width: 100%; border-collapse: collapse; margin-top: 0.8rem; font-size: 0.85rem;">
            <thead>
               <tr style="background: #054F31; color: white;">
                  <th style="padding: 0.6rem; text-align: left;">Categoria</th>
                  <th style="padding: 0.6rem; text-align: right;">Total R$</th>
               </tr>
            </thead>
            <tbody>
               ${expenseCategories.map(cat => {
                 let t = cat.items.reduce((acc, a) => acc + (a.qty * a.val), 0);
                 return `<tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 0.6rem;">${cat.name}</td>
                    <td style="padding: 0.6rem; text-align: right; font-weight: 600;">${formatCurrency(t)}</td>
                 </tr>`;
               }).join('')}
               <tr style="background: #f8fafc; border-top: 2px solid #054F31;">
                  <td style="padding: 0.6rem; font-weight: bold; color: #054F31;">TOTAL DESPESAS DIRETAS</td>
                  <td style="padding: 0.6rem; text-align: right; font-weight: 800; color: #054F31; font-size: 1rem;">${formatCurrency(dExp)}</td>
               </tr>
            </tbody>
         </table>
         ${footerHTML}
      </div>
     `;

     // Pg 3 - Detalhamento de Itens
     const page3HTML = `
      <div class="pdf-page" id="pdf-page-3">
         <h2 style="color: #054F31; font-size: 1.8rem; border-bottom: 2px solid #054F31; padding-bottom: 0.5rem; margin-bottom: 1.5rem;">Detalhamento de Itens</h2>
         <p style="margin-bottom: 1.5rem; color: #64748B;">Listagem completa de todos os custos diretos previstos para o projeto.</p>
         
         <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
            <thead>
               <tr style="background: #054F31; color: white;">
                  <th style="padding: 0.6rem; text-align: left;">Item / Descrição</th>
                  <th style="padding: 0.6rem; text-align: center; width: 60px;">Qtd</th>
                  <th style="padding: 0.6rem; text-align: right; width: 120px;">V. Unitário</th>
                  <th style="padding: 0.6rem; text-align: right; width: 120px;">Total</th>
               </tr>
            </thead>
            <tbody>
               ${expenseCategories.map(cat => `
                  <tr style="background: rgba(5, 79, 49, 0.1); font-weight: bold;">
                     <td colspan="4" style="padding: 0.6rem; color: #054F31; border-top: 1px solid #ccc;">${cat.name}</td>
                  </tr>
                  ${cat.items.map(item => `
                     <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 0.5rem; padding-left: 1.5rem;">${item.desc || '(Sem descrição)'}</td>
                        <td style="padding: 0.5rem; text-align: center;">${item.qty}</td>
                        <td style="padding: 0.5rem; text-align: right;">${formatCurrency(item.val)}</td>
                        <td style="padding: 0.5rem; text-align: right; font-weight: 600;">${formatCurrency(item.qty * item.val)}</td>
                     </tr>
                  `).join('')}
               `).join('')}
               <tr style="background: #f8fafc; border-top: 2px solid #054F31;">
                  <td colspan="3" style="padding: 0.8rem; font-weight: bold; color: #054F31; text-align: right;">TOTAL GERAL DE DESPESAS DIRETAS</td>
                  <td style="padding: 0.8rem; text-align: right; font-weight: 800; color: #054F31; font-size: 1.1rem;">${formatCurrency(dExp)}</td>
               </tr>
            </tbody>
         </table>
         ${footerHTML}
      </div>
     `;

     // Pg 4 - Análise Comparativa
     let cLucro = cPrice - dExp - (cPrice * (rates/100));
     let cMargin = cPrice > 0 ? (cLucro / cPrice) * 100 : 0;
     let marginCor = cMargin <= 5 ? '#DC2626' : (cMargin <= 12 ? '#CA8A04' : '#16A34A');
     
     const page4HTML = `
      <div class="pdf-page" id="pdf-page-4">
         <h2 style="color: #054F31; font-size: 2rem; border-bottom: 2px solid #054F31; padding-bottom: 0.5rem; margin-bottom: 2rem;">Análise Comparativa</h2>
         
         <div style="padding: 2rem; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <p style="font-size: 1.25rem; line-height: 1.8; color: #2C3E50;">
               A proposta apresenta uma margem de lucro sugerida inicial de <strong>${appState.profitMargin}%</strong> gerando um ticket ideal de <strong>${formatCurrency(sPrice)}</strong>.
            </p>
            <p style="font-size: 1.25rem; line-height: 1.8; color: #2C3E50; margin-top: 1.5rem;">
               Contudo, o valor fechado estipulado é de <strong>${formatCurrency(cPrice)}</strong>. 
               Ao abater as incidências das taxas variáveis (${rates.toFixed(2)}%) e despesas diretas (${formatCurrency(dExp)}), a margem líquida real converteu para um percentual de:
            </p>
            
            <div style="margin-top: 3rem; text-align: center; padding: 3rem; border-radius: 12px; background: white; border: 4px solid ${marginCor}; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
               <div style="font-size: 1.5rem; color: #64748B; font-weight: bold; text-transform: uppercase; margin-bottom: 1rem;">Margem Liquida Alcançada</div>
               <div style="font-size: 5rem; font-weight: 800; color: ${marginCor};">${cMargin.toFixed(2)}%</div>
               <div style="font-size: 1.5rem; font-weight: 700; margin-top: 1rem; color: ${marginCor};">
                   (${formatCurrency(cLucro)})
               </div>
            </div>
         </div>
         ${footerHTML}
      </div>
     `;

     pdfContainer.innerHTML = page1HTML + page2HTML + page3HTML + page4HTML;
     pdfContainer.style.display = 'block'; // make visible for canvas rendering
     
     // Pequena pausa para garantir que o DOM renderizou o novo conteúdo
     await new Promise(resolve => setTimeout(resolve, 300));

     const { jsPDF } = window.jspdf;
     const pdf = new jsPDF('p', 'mm', 'a4');
     
     const pages = [
       document.getElementById('pdf-page-1'), 
       document.getElementById('pdf-page-2'), 
       document.getElementById('pdf-page-3'),
       document.getElementById('pdf-page-4')
     ];
     
     for (let i = 0; i < pages.length; i++) {
       // Renderizar cada página
       const canvas = await html2canvas(pages[i], { 
         scale: 2, 
         useCORS: true,
         logging: false,
         allowTaint: true
       });
       const imgData = canvas.toDataURL('image/png');
       if (i > 0) pdf.addPage();
       // A4 size: 210 x 297mm
       pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
     }

     pdfContainer.style.display = 'none'; // hide again
     pdfContainer.innerHTML = '';
     
     pdf.save(`${fileName}.pdf`);
     
   } catch(e) {
     console.error(e);
     alert('Erro ao gerar PDF.');
   } finally {
     loading.classList.add('hidden');
   }
});
