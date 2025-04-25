const currencyConverter = {
    baseCurrency: "RUB",
    targetCurrency: "USD",
    ratesData: {},
    isCalculating: false,
    lastChangedField: 'from',
    
    init() {
      this.fromInput = document.querySelector('.from-amount');
      this.toInput = document.querySelector('.to-amount');
      this.fromButtons = document.querySelectorAll('.converter-panel:first-child .currency-option');
      this.toButtons = document.querySelectorAll('.converter-panel:last-child .currency-option');
      this.fromRateDisplay = document.querySelector('.from-rate');
      this.toRateDisplay = document.querySelector('.to-rate');
      
      this.setupEventListeners();
      this.loadExchangeRates(this.baseCurrency);
    },
    
    setupEventListeners() {
      this.fromButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.baseCurrency = btn.dataset.currency;
          this.updateActiveButtons();
          this.loadExchangeRates(this.baseCurrency);
        });
      });
      
      this.toButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.targetCurrency = btn.dataset.currency;
          this.updateActiveButtons();
          this.convertCurrency();
        });
      });
      
      this.fromInput.addEventListener('input', () => this.handleInputChange('from'));
      this.toInput.addEventListener('input', () => this.handleInputChange('to'));
    },
    
    formatNumber(value) {
      return new Intl.NumberFormat('az-AZ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 5
      }).format(value);
    },
    
    sanitizeInput(input) {
      let cleaned = input.replace(',', '.').replace(/[^0-9.]/g, '');
      const dotIndex = cleaned.indexOf('.');
      
      if (dotIndex !== -1) {
        cleaned = cleaned.slice(0, dotIndex + 1) + cleaned.slice(dotIndex + 1).replace(/\./g, '');
      }
      
      if (cleaned === '.') cleaned = '0.';
      if (cleaned.includes('.')) {
        const parts = cleaned.split('.');
        cleaned = parts[0] + '.' + parts[1].slice(0, 5);
      }
      
      if (cleaned.replace('.', '').length > 16) {
        const parts = cleaned.split('.');
        cleaned = parts[0].slice(0, 16) + (parts[1] ? '.' + parts[1].slice(0, 5) : '');
      }
      
      return cleaned;
    },
    
    async loadExchangeRates(currency) {
      try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${currency}`);
        const data = await response.json();
        
        if (data.rates) {
          this.ratesData = data.rates;
          this.convertCurrency();
        } else {
          throw new Error("Məzənnə məlumatları alınmadı");
        }
      } catch (error) {
        console.error("Xəta:", error);
        document.querySelector('.app-main').innerHTML = `
          <h1 style="color: #dc3545;">Xəta baş verdi</h1>
          <p>Məzənnə məlumatları yüklənə bilmədi. Zəhmət olmasa internet bağlantınızı yoxlayın və səhifəni yeniləyin.</p>
        `;
      }
    },
    
    updateActiveButtons() {
      this.fromButtons.forEach(btn => 
        btn.classList.toggle('selected', btn.dataset.currency === this.baseCurrency));
      this.toButtons.forEach(btn => 
        btn.classList.toggle('selected', btn.dataset.currency === this.targetCurrency));
    },
    
    handleInputChange(field) {
      if (this.isCalculating) return;
      this.isCalculating = true;
      this.lastChangedField = field;
      
      const inputElement = field === 'from' ? this.fromInput : this.toInput;
      inputElement.value = this.sanitizeInput(inputElement.value);
      
      this.convertCurrency();
      this.isCalculating = false;
    },
    
    convertCurrency() {
      if (!this.ratesData[this.targetCurrency]) return;
      
      const exchangeRate = this.ratesData[this.targetCurrency];
      const reverseRate = 1 / exchangeRate;
      
      if (this.baseCurrency === this.targetCurrency) {
        const amount = this.lastChangedField === 'from' 
          ? parseFloat(this.fromInput.value.replace(/\s/g, '')) || 0
          : parseFloat(this.toInput.value.replace(/\s/g, '')) || 0;
          
        this.fromInput.value = this.toInput.value = this.formatNumber(amount);
        this.fromRateDisplay.textContent = `1 ${this.baseCurrency} = 1 ${this.targetCurrency}`;
        this.toRateDisplay.textContent = `1 ${this.targetCurrency} = 1 ${this.baseCurrency}`;
        return;
      }
      
      if (this.lastChangedField === 'from') {
        const amount = parseFloat(this.fromInput.value.replace(/\s/g, '')) || 0;
        this.toInput.value = this.formatNumber(amount * exchangeRate);
      } else {
        const amount = parseFloat(this.toInput.value.replace(/\s/g, '')) || 0;
        this.fromInput.value = this.formatNumber(amount * reverseRate);
      }
      
      this.fromRateDisplay.textContent = `1 ${this.baseCurrency} = ${exchangeRate.toFixed(5)} ${this.targetCurrency}`;
      this.toRateDisplay.textContent = `1 ${this.targetCurrency} = ${reverseRate.toFixed(5)} ${this.baseCurrency}`;
    }
  };
  
  document.addEventListener('DOMContentLoaded', () => {
    currencyConverter.init();
  });