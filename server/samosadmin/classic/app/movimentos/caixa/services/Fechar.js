Ext.define('SamosAdmin.movimentos.caixa.services.Fechar', {
    alternateClassName: 'Caixa.services.Fechamento',
    singleton: true,

    validar: async function() {
        const listCaixaVm  = Ext.$('caixa')[0].getViewModel();
        const formFecharVm = (Ext.$('formcaixafechar')[0] || Ext.$('formcaixasangria')[0]).getViewModel();
        const isFechamento = Ext.$('formcaixafechar')[0];

        const sldDinheiro = listCaixaVm.get('saldoDinheiro');
        const digDinheiro = formFecharVm.get('valorDinheiro');

        const sldCheque = listCaixaVm.get('saldoCheque');
        const digCheque = formFecharVm.get('valorCheque');

        const sldCredito = listCaixaVm.get('saldoCredito');
        const digCredito = formFecharVm.get('valorCredito');

        const sldDebito = listCaixaVm.get('saldoDebito');
        const digDebito = formFecharVm.get('valorDebito');
        
        const sldCreditoloja = listCaixaVm.get('saldoCreditoloja');
        const digCreditoloja = formFecharVm.get('valorCreditoloja');
        
        const sldAlimentacao = listCaixaVm.get('saldoAlimentacao');
        const digAlimentacao = formFecharVm.get('valorAlimentacao');

        const sldRefeicao = listCaixaVm.get('saldoRefeicao');
        const digRefeicao = formFecharVm.get('valorRefeicao');
        
        const sldPresente = listCaixaVm.get('saldoPresente');
        const digPresente = formFecharVm.get('valorPresente');
        
        const sldCombustivel = listCaixaVm.get('saldoCombustivel');
        const digCombustivel = formFecharVm.get('valorCombustivel');

        const sldDuplicata = listCaixaVm.get('saldoDuplicata');
        const digDuplicata = formFecharVm.get('valorDuplicata');

        const sldTransf = listCaixaVm.get('saldoTransf');
        const digTransf = formFecharVm.get('valorTransf');

        const sldOutro = listCaixaVm.get('saldoOutro');
        const digOutro = formFecharVm.get('valorOutro');

        const fechamentoValido = configs.getFinanceiros().transferirSaldoCaixa ?
                                 ((digDinheiro + digCheque) <= (sldDinheiro + sldCheque)) :
                                 ((digDinheiro + digCheque) == (sldDinheiro + sldCheque));

        if(isFechamento && !fechamentoValido) {
            throw 'Saldo de fechamento deve ser igual a saldo disponível';
        }

        const valido = cents(digDinheiro)    <= cents(sldDinheiro)    &&
               cents(digCheque)      <= cents(sldCheque)      &&
               cents(digCredito)     <= cents(sldCredito)     &&
               cents(digDebito)      <= cents(sldDebito)      &&
               cents(digCreditoloja) <= cents(sldCreditoloja) &&
               cents(digAlimentacao) <= cents(sldAlimentacao) &&
               cents(digRefeicao)    <= cents(sldRefeicao)    &&
               cents(digPresente)    <= cents(sldPresente)    &&
               cents(digCombustivel) <= cents(sldCombustivel) &&
               cents(digDuplicata)   <= cents(sldDuplicata)   &&
               cents(digTransf)      <= cents(sldTransf)      &&
               cents(digOutro)       <= cents(sldOutro);

        if(!valido) {
            throw 'Valor superior ao saldo - não permitido';
        }
    }
});
