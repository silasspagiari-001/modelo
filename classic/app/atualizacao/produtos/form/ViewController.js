Ext.define('SamosAdmin.atualizacao.produtos.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formprodutos',

    initViewModel: function (vm) {
        Ext.asap(() => {
            if(configs.getClientName() == 'biomart' ||
               configs.getClientName() == 'organoplant') {
                try {
                    const descricao = vm.get('model.PRODUTOS_DESCRICAO');
                    const multiplos = grams(descricao.split('|')[2]) || 1000;
                    vm.set('model.MULTIPLOS_PRODUTOS', multiplos / 1000);
                } catch (error) {
                    console.log(error)
                }
            }
            if(configs.getClientName() == 'prudenmoveis') {
                try {
                    this.carregaParametros();
                } catch (error) {
                    console.log(error)
                }
            }
        });
    },

    copiarParaMultiplos: function() {
        setTimeout(() => {
            if(configs.getClientName() == 'biomart' ||
               configs.getClientName() == 'organoplant') {
                const model = this.getRecord();
                model.set('MULTIPLOS_PRODUTOS', model.get('PRODUTOS_EMBALAGEM'));
            }
        }, 1000);
    },

    onGerarCdbClick: function (btn, event) {

        setTimeout(() => {
            const model = this.getRecord();
            const view = this.getView();
            const idProduto = model.get('PRODUTOS_ID');

            if(idProduto > 0) {
                view.initGauge('Gerando Código de barras...');                
                let prefix = '789' + ('000000000' + idProduto.toString()).slice(-9);
                let digito = this.gerarDigitoEAN(prefix);
                let barraFinal = prefix + digito;
                model.set('PRODUTOS_BARRA', barraFinal);
                view.stopGauge();                
            } else {
                Ext.Note('warning', 'Produto sem ID'); 
            }
        }, 1000);
        
    },

    gerarDigitoEAN: function(barra) {
        
        let flag = true, 
            soma = 0,
            arrBarras = barra.split('');

        for (i = barra.length - 1; i >= 0; i--) {
            soma += parseInt(arrBarras[i]) * (flag ? 3 : 1);
            flag = !flag;
        }
        return (10 - (soma % 10)) % 10;

    },

    onGravarClick: function (btn, event) {
        const model = this.getRecord();
        
        model.getProxy().setExtraParam('empresa', configs.getEmpresa().id);

        if((configs.getProdutos().conveniooutros || []).length > 0){
            const letrasConvenios = (model.get('CONVENIO_LOCAL') || '') + '|' + (model.get('CONVENIO_OUTROS') || '') + '|' + (model.get('CONVENIO_REGIAO12') || '');
            model.set({
                'SALDOS_LOCAL': letrasConvenios
            });
        }

        const cstLocal = (model.get('TABELA_ORIGEM') || '').trim() + (model.get('TABELA_LOCAL') || '').trim();
        const cstOutros = (model.get('TABELA_ORIGEM') || '').trim() + (model.get('TABELA_OUTROS') || '').trim();

        model.set({
            'SALDOS_CSTLOCAL'  : cstLocal,
            'SALDOS_CSTOUTROS' : cstOutros
        });

        if(configs.getClientName() == 'biomart' || 
           configs.getClientName() == 'organoplant') {
            try {
                const multiplos = grams(model.get('MULTIPLOS_PRODUTOS'));
                const descricao = model.get('PRODUTOS_DESCRICAO');
                const partes = descricao.split('|');
                partes[2] = multiplos / 1000;
                model.set('PRODUTOS_DESCRICAO', partes.join('|'));
            } catch (error) {
                console.log(error)
            }
        }

        this.callParent(arguments);
    },

    validarCabecalho: async function() {
        return this.callParent(arguments);
    },

    colocarFilhosNoModel: function (model) {
        var saldos = [{}];

        for (var i in model.data) {
            if(i.match(/SALDOS_/)) {
                saldos[0][i] = model.data[i];
                delete model.data[i];
            }
        }

        model.set('SALDOS', saldos);

        this.callParent(arguments);
    },
    
    onGravacaoSucesso: function (record) {
        var saldos = record.get('SALDOS');

        for (var i in saldos[0]) {
            record.set(i, saldos[0][i]);
        }

        delete record.data['SALDOS'];
        this.callParent(arguments);
    },

    carregaParametros: async function() {

        await SamosUtils.Utils.sleep(200);
        
        const vm = this.getViewModel();
        let perIpi      = 0
        let perFrete    = 0
        let perPrazo    = 0
        let perSeguro   = 0
        let perDespesas = 0

        const formula = SamosUtils.Json.parseJSON(vm.get('model.PESSOAS_FORMULA'));
        if(formula) {
            perIpi      = formula['ipi']      || 0;
            perFrete    = formula['frete']    || 0;
            perPrazo    = formula['prazo']    || 0;            
            perSeguro   = formula['seguro']   || 0;
            perDespesas = formula['despesas'] || 0;
        }
        vm.set('model.SALDOS_IPI', perIpi);
        vm.set('model.PERCENTUAL_FRETE', perFrete);
        vm.set('model.PERCENTUAL_SEGURO', perSeguro);
        vm.set('model.PERCENTUAL_DESPESAS', perDespesas);                                
    },

    calcularValores: async function(txt) {
        if(txt && txt.readOnly) { return true; }

        await SamosUtils.Utils.sleep(200);
        
        const vm = this.getViewModel();
        const margem = vm.get('model.SALDOS_MARGEM');
        const margemMinima = vm.get('model.SALDOS_MARGEMMINIMA');
        const margemPromocao = vm.get('model.SALDOS_TRANSFERENCIA');
        
        let custo    = cents(vm.get('model.SALDOS_CUSTO'));
        let compra   = cents(vm.get('model.SALDOS_COMPRA'));
        if( margem > 0 && (custo > 0 || compra > 0) ) {
            let vista = eval(configs.getProdutos().calculoPreco.vista);
            let prazo = eval(configs.getProdutos().calculoPreco.prazo);
            
            if(configs.getClientName().match(/prudenmoveis/)) { // Prudenmoveis
                if(vista > 0) { vm.set('model.SALDOS_PRECO',  ((Math.ceil(vista/1000) * 1000) / 100)); }                
            } else if(configs.getClientName().match(/stilomoveis/)) { // Stilo
               if(vista > 0) { vm.set('model.SALDOS_PRECO',  ((Math.ceil(vista/1000) * 1000) / 100)); }
               if(prazo > 0) { vm.set('model.SALDOS_PRAZO',  (prazo / 100).toFixed(0)); }
            } else {
                if(vista > 0) { vm.set('model.SALDOS_PRECO',  vista / 100); }
                if(prazo > 0) { vm.set('model.SALDOS_PRAZO',  prazo / 100); }    
            }

        }

        if(custo > 0 && configs.getClientName() == 'stilomoveis') {
            let calcPromocao = (custo + (custo * (margemPromocao / 100)));
            let precoPromocao = ((((Math.ceil(calcPromocao/1000) * 1000) / 100)) - 1);
            if(margemPromocao > 0) {
                vm.set('model.SALDOS_PRAZO', precoPromocao);
            } else {
                vm.set('model.SALDOS_PRAZO', 0);
            }
        }   

        if(margemMinima > 0 && custo > 0 && configs.getClientName() == 'stilomoveis') {
            let calcMinimo = (custo + (custo * (margemMinima / 100)));
            let precoMinimo = (((Math.ceil(calcMinimo/1000) * 1000) / 100));
            if(precoMinimo > 0) {
                vm.set('model.SALDOS_PRECOMINIMO', precoMinimo);
            }
        }   


    },

    calcularPrecosA: async function(txt) {
        if(txt && txt.readOnly) { return true; }

        await SamosUtils.Utils.sleep(200);
        
        const vm = this.getViewModel();
        const margem = vm.get('model.SALDOS_MARGEMMINIMA'); // Margem 2 raça       
        let custo  = cents(vm.get('model.SALDOS_COMPRADO'));  // Custo 2 raça

        if( margem > 0 && custo > 0) {
            let vista = eval(configs.getProdutos().calculoPreco.vista);            
            if(vista > 0) { vm.set('model.SALDOS_PRECOMINIMO',  vista / 100); }                
        }
    },

    calcularCusto: async function(txt) { // Calculo custos Prudenmóveis / Stilo
        if(txt && txt.readOnly) { return true; }

        await SamosUtils.Utils.sleep(200);
                
        const vm = this.getViewModel();
        const margem = vm.get('model.SALDOS_MARGEM');

        let compra = cents(vm.get('model.SALDOS_COMPRA'));
        let perFrete = configs.getClientName() == 'stilomoveis'  ? cents(vm.get('model.SALDOS_RESERVADO')) / 100 :
                       configs.getClientName() == 'prudenmoveis' ? cents(vm.get('model.PERCENTUAL_FRETE')) / 100 : 0;
        let perSeguro   = configs.getClientName() == 'prudenmoveis' ? cents(vm.get('model.PERCENTUAL_SEGURO')) / 100 : 0;
        let perDespesas = configs.getClientName() == 'prudenmoveis' ? cents(vm.get('model.PERCENTUAL_DESPESAS')) / 100 : 0;

        let perIpi = cents(vm.get('model.SALDOS_IPI')) / 100 ;
        let valorIpi      = compra * (perIpi / 100);
        let valorFrete    = ((compra + valorIpi)  * (perFrete / 100));
        let valorSeguro   = ((compra + valorIpi)  * (perSeguro / 100));
        let valorDespesas = ((compra + valorIpi)  * (perDespesas / 100));
        
        let custo  = configs.getClientName == 'stilomoveis' ? (compra + valorFrete + valorIpi) : // Stilo
                                                              (compra + valorIpi + valorFrete + valorSeguro + valorDespesas) // Prudenmóveis

        if(custo > 0) {
            vm.set('model.SALDOS_CUSTO', custo / 100);
        }

        if( margem > 0 && (custo > 0 || compra > 0) ) {
            let vista = eval(configs.getProdutos().calculoPreco.vista);
            let prazo = eval(configs.getProdutos().calculoPreco.prazo);
            
            if(configs.getClientName().match(/prudenmoveis/)) { // Prudenmoveis
                if(vista > 0) { vm.set('model.SALDOS_PRECO',  ((Math.ceil(vista/1000) * 1000) / 100)); }
                if(prazo > 0) { vm.set('model.SALDOS_PRAZO',  (prazo / 100).toFixed(0)); }
            } else if(configs.getClientName().match(/stilomoveis/)) { // Stilo
               if(vista > 0) { vm.set('model.SALDOS_PRECO',  ((Math.ceil(vista/1000) * 1000) / 100)); }
                if(prazo > 0) { vm.set('model.SALDOS_PRAZO',  (prazo / 100).toFixed(0)); }
            } else {
                if(vista > 0) { vm.set('model.SALDOS_PRECO',  vista / 100); }
                if(prazo > 0) { vm.set('model.SALDOS_PRAZO',  prazo / 100); }    
            }

        }

        let margemMinima = vm.get('model.SALDOS_MARGEMMINIMA');
        let custoMinimo  = vm.get('model.SALDOS_CUSTO');

        if(configs.getClientName() == 'stilomoveis') {
            if(margemMinima > 0 && custoMinimo > 0) {
                let calcMinimo = (cents(custoMinimo) + (cents(custoMinimo) * (margemMinima / 100)));
                let precoMinimo = ((Math.ceil(calcMinimo/1000) * 1000) / 100) ; // (((Math.ceil(calcMinimo/1000) * 1000) / 100) - 1);
                if(precoMinimo > 0) {
                    vm.set('model.SALDOS_PRECOMINIMO', precoMinimo);
                }
            }   

            let margemPromocao = vm.get('model.SALDOS_TRANSFERENCIA');
            let custoPromocao  = vm.get('model.SALDOS_CUSTO');
    
            if(configs.getClientName() == 'stilomoveis') {
                if(margemPromocao > 0 && custoPromocao > 0) {
                    let calcPromocao = (cents(custoPromocao) + (cents(custoPromocao) * (margemPromocao / 100)));
                    let precoPromocao = (((Math.ceil(calcPromocao/1000) * 1000) / 100) - 1);
                    if(precoPromocao > 0) {
                        vm.set('model.SALDOS_PRAZO', precoPromocao);
                    }
                }    
            }                         
        } 

        if(configs.getClientName() == 'prudenmoveis') {
            let margemPrazo = vm.get('model.SALDOS_ALIQUOTACFE');
            let precoVista  = cents(vm.get('model.SALDOS_PRECO'));
    
            if(precoVista > 0) {
                let precoPrazo = (precoVista + (precoVista * (margemPrazo / 100))).toFixed(0);
                if(precoPrazo > 0) { vm.set('model.SALDOS_PRAZO',  ((Math.ceil(precoPrazo/1000) * 1000) / 100)); }
            }   
            
            if(margemMinima > 0 && custoMinimo > 0) {
                let precoMinimo = (custoMinimo + (custoMinimo * (margemMinima / 100))).toFixed(0);
                
                if(precoMinimo > 0) {
                    vm.set('model.SALDOS_PRECOMINIMO', precoMinimo);
                }
            }    

        }
    },

    setarDerivado: async function(txt) {
        if(txt && txt.readOnly) { return true; }

        await SamosUtils.Utils.sleep(200);
        
        const vm = this.getViewModel();
        const grupo = vm.get('model.PRODUTOS_ID_GRUPOS');

        vm.set('model.PRODUTOS_DERIVADO', 'F');

        if(grupo == 7) {
            vm.set('model.PRODUTOS_DERIVADO', 'C')  // Fios cirurgicos
        }

        if(grupo == 57) {
            vm.set('model.PRODUTOS_DERIVADO', 'M')  // Medicamentos
        }
        
        if(grupo == 87) {
            vm.set('model.PRODUTOS_DERIVADO', 'S')  // Soros
        }

    },

    setarMargemGrupo: async function(txt) {
        if(txt && txt.readOnly) { return true; }

        await SamosUtils.Utils.sleep(200);
        
        const vm = this.getViewModel();

        const perComissao = vm.get('model.PERCENTUAL_COMISSAO');
        const perMargem   = vm.get('model.PERCENTUAL_MARGEM');
        const perMinima   = vm.get('model.PERCENTUAL_MARGEMMINIMA');

        if(perComissao > 0) {
            vm.set('model.SALDOS_COMISSAO',     perComissao);
        }

        if(perMargem > 0) {
            vm.set('model.SALDOS_MARGEM',       perMargem);
        }
        
        if(perMinima > 0) {
            vm.set('model.SALDOS_MARGEMMINIMA', perMinima);
        }

    },

    calcularMargem: async function(txt) {
        //Passa direto
        return true;
        
        /*
        if(txt && txt.readOnly) { return true; }
        if(configs.getClientName() == 'hermes' || 
           configs.getClientName() == 'prudenmoveis') { return true; }

        const vm     = this.getViewModel();           
        const custo  = cents(vm.get('model.SALDOS_CUSTO'))  || 0;//usados no eval abaixo
        const compra = cents(vm.get('model.SALDOS_COMPRA')) || 0;//usados no eval abaixo

        if(custo == 0 || compra == 0) { return true; }

        await SamosUtils.Utils.sleep(200);
        
        let vista = cents(vm.get('model.SALDOS_PRECO')) || 0;//usados no eval abaixo

        const margem = eval(configs.getProdutos().calculoPreco.margem);

        vm.set('model.SALDOS_MARGEM', margem.toFixed(2) || 0)
        */
    },

    calcularPrecoMinimo: async function(txt) {
        if(txt && txt.readOnly) { return true; }

        const vm = this.getViewModel()
        
        await SamosUtils.Utils.sleep(200);

        let margemMinima = vm.get('model.SALDOS_MARGEMMINIMA');
        let custoMinimo  = vm.get('model.SALDOS_CUSTO');

        if(configs.getClientName() == 'stilomoveis') {
            if(margemMinima > 0 && custoMinimo > 0) {
                let calcMinimo = (cents(custoMinimo) + (cents(custoMinimo) * (margemMinima / 100)));
                let precoMinimo = ((Math.ceil(calcMinimo/1000) * 1000) / 100);//(((Math.ceil(calcMinimo/1000) * 1000) / 100) - 1);
                if(precoMinimo > 0) {
                    vm.set('model.SALDOS_PRECOMINIMO', precoMinimo);
                }
            }    
        } else {
            if(margemMinima > 0 && custoMinimo > 0) {
                let precoMinimo = (custoMinimo + (custoMinimo * (margemMinima / 100))).toFixed(0);
                
                if(precoMinimo > 0) {
                    vm.set('model.SALDOS_PRECOMINIMO', precoMinimo);
                }
            }    
        }
    },

    calcularPrecoPromocional: async function(txt) {
        if(txt && txt.readOnly) { return true; }

        const vm = this.getViewModel()
        
        await SamosUtils.Utils.sleep(200);

        let margemPromocao = vm.get('model.SALDOS_TRANSFERENCIA');
        let custoPromocao  = vm.get('model.SALDOS_CUSTO');

        if(configs.getClientName() == 'stilomoveis') {
            if(custoPromocao > 0) {
                let calcPromocao = (cents(custoPromocao) + (cents(custoPromocao) * (margemPromocao / 100)));
                let precoPromocao = (((Math.ceil(calcPromocao/1000) * 1000) / 100) - 1);
                if(margemPromocao > 0) {
                    vm.set('model.SALDOS_PRAZO', precoPromocao);
                } else {
                    vm.set('model.SALDOS_PRAZO', 0);
                }
            }    
        }
    },

    onFotosClick: function() {
        const view = Ext.create({
            xtype: 'formprodutosfotos'
        });

        view.getViewModel().set({
            'idProduto' : this.getRecord().get('PRODUTOS_ID')
        });
    },

    onCstIbsCbsChange: function(combo, value) {
        var view = this.getView();
        var comboClassTrib = view.lookupReference('cclasstrib');

        if (!comboClassTrib) {
            return;
        }

        var store = comboClassTrib.getStore();

        store.clearFilter();

        if (value) {
            value = String(value).trim();

            store.filterBy(function(record) {
                var codigo = String(record.get('field1') || '').trim();

                return codigo.substring(0, 3) === value;
            });
        }
    }

});
