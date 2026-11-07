Ext.define('SamosAdmin.movimentos.movimento.form.pessoa.ViewController', {
    extend: 'SamosAdmin.movimentos.movimento.form.ViewController',
    alias: 'controller.formmovimentospessoa',

    initViewModel: function(vm) {

        Ext.asap(async () => {

            const form = Ext.$('formmovimentos')[0] || [];

            this.getView().initGauge();

            try {
                const model     = vm.get('model');
                const cnpPessoa = form.getViewModel().get('model.PESSOAS_CPFCNPJ') || '';

                model.set('PESSOAS_CPFCNPJ', cnpPessoa);
                
            } catch(error){
                console.error(error);
            }

            this.getView().stopGauge(); 
            
        });            

        this.getViewModel().set('readOnly', false);
    },

    onGravarClick: async function(btn, e) {

        const pessoa = this.getRecord();  
        const movimento = this.getView().up('formmovimentos').getViewModel().get('model');
        let pessoaGravada;

        if(!SamosUtils.String.isCpf(pessoa.get('PESSOAS_CPFCNPJ')) &&
            !SamosUtils.String.isCnpj(pessoa.get('PESSOAS_CPFCNPJ'))) {
            Ext.Note('warning', 'CPF/CNPJ Inválido');
            return;
        }    

        if(!pessoa.get('PESSOAS_NOME')) {
            Ext.Note('warning', 'Informe o nome');
            return;
        }

        if(!pessoa.get('PESSOAS_ENDERECO')) {
            Ext.Note('warning', 'Informe o endereço');
            return;
        }

        if(!pessoa.get('PESSOAS_BAIRRO')) {
            Ext.Note('warning', 'Informe o bairro');
            return;
        }

        if(!pessoa.get('PESSOAS_NUMERO')) {
            Ext.Note('warning', 'Informe o número');
            return;
        }

        if(!pessoa.get('PESSOAS_EMAIL')) {
            Ext.Note('warning', 'Informe o E-mail');
            return;
        }

        if(!pessoa.get('PESSOAS_CEP')) {
            Ext.Note('warning', 'Informe o CEP');
            return;
        }

        pessoa.set('PESSOAS_STATUS', 'T');
        pessoa.set('PESSOAS_ENDERECOCOBRANCA', pessoa.get('PESSOAS_ENDERECO'));
        pessoa.set('PESSOAS_NUMEROCOBRANCA', pessoa.get('PESSOAS_NUMERO'));
        pessoa.set('PESSOAS_CEPCOBRANCA', pessoa.get('PESSOAS_CEP'));
        pessoa.set('PESSOAS_BAIRROCOBRANCA', pessoa.get('PESSOAS_BAIRRO'));
        pessoa.set('PESSOAS_ID_CIDADESCOBRANCA', pessoa.get('PESSOAS_ID_CIDADES'));
        pessoa.set('PESSOAS_CELULARCOBRANCA', pessoa.get('PESSOAS_CELULAR'));
        if(configs.getPessoas().usarCampoRG) {
            pessoa.set('PESSOAS_TELEFONECOBRANCA', pessoa.get('REGISTRO_GERAL'));
        }
        pessoa.set('PESSOAS_FORMULA', '');

        //Deixar apenas numeros no CPF
        pessoa.set('PESSOAS_CPFCNPJ', SamosUtils.String.onlyNumbers( pessoa.get('PESSOAS_CPFCNPJ') ) );

        if(pessoa.get('PESSOAS_ID') > 0) { // Se já cadastrado atualiza
            pessoaGravada = await SamosUtils.Request.nodeApi({
                url: `/pessoas/${pessoa.get('PESSOAS_ID')}`,
                method: 'PUT',
                data: pessoa.data
            });
        } else {  // Insere nova pessoa
            pessoaGravada = await SamosUtils.Request.nodeApi({
                url: `/pessoas`,
                method: 'POST',
                data: pessoa.data
            });    
        }

        const idPessoaInserida = pessoaGravada.results['PESSOAS_ID'] || 0;
        const nmPessoaInserida = pessoaGravada.results['PESSOAS_NOME'] || '';
        const enPessoaInserida = pessoaGravada.results['PESSOAS_ENDERECO'] || '';
        const cpPessoaInserida = pessoaGravada.results['PESSOAS_CPFCNPJ'] || '';
        const cePessoaInserida = pessoaGravada.results['PESSOAS_CELULAR'] || '';
        const emPessoaInserida = pessoaGravada.results['PESSOAS_EMAIL'] || '';
        const idMovimento      = movimento.get('MOVIMENTOS_ID');

        if(idPessoaInserida > 0) {
            atualizarPessoaOrcamento = await SamosUtils.Request.nodeApi({
                url: `/processos/movimentos/atualizarpessoa/${idMovimento}`,
                method: 'PUT',
                data: {
                    'MOVIMENTOS_ID_PESSOAS': idPessoaInserida,
                    'MOVIMENTOS_NOME': nmPessoaInserida,
                    'MOVIMENTOS_CPFCNPJ': cpPessoaInserida,
                    'MOVIMENTOS_CELULAR': cePessoaInserida,                    
                    'MOVIMENTOS_EMAIL': emPessoaInserida,
                    'MOVIMENTOS_PROTOCOLO': 'X'
                }
            });                          
            Ext.Note('success', 'Gravado com sucesso');
            movimento.set('MOVIMENTOS_ID_PESSOAS', idPessoaInserida);
            movimento.set('MOVIMENTOS_NOME', nmPessoaInserida);
            movimento.set('MOVIMENTOS_CPFCNPJ', cpPessoaInserida);
            movimento.set('MOVIMENTOS_CELULAR', cePessoaInserida);
            movimento.set('PESSOAS_ENDERECO', enPessoaInserida);
            movimento.set('PESSOAS_TELEFONE', pessoa.get('PESSOAS_TELEFONE'));
            movimento.set('MOVIMENTOS_EMAIL', emPessoaInserida);
            movimento.set('MOVIMENTOS_PROTOCOLO', 'X');
            movimento.set('CIDADES_NOME', pessoa.get('CIDADES_NOME'));
            movimento.set('CIDADES_ESTADO', pessoa.get('CIDADES_ESTADO'));
            movimento.set('CIDADES_STATUS', pessoa.get('CIDADES_STATUS'));

            this.onSairClick();                           
        }    
        
    },

    setCepSearchedId: function (txt, record) {
        this.lookup('cep').setSearchedId(record.get('PESSOAS_CEP'));
    },
    
    verificarCPFCNPJExistente: async function (txt, event) {
        if (!SamosUtils.Events.isTab(event) && !SamosUtils.Events.isEnter(event)) {
            return;
        }

        const view = this.getView();

        try {
            const model = this.getRecord();
            const txtCpf = this.lookup('cpf');
            const proximoFoco = this.lookup(txt.proximoFoco);
            const cpfCnpjInformado = SamosUtils.String.onlyNumbers(txtCpf.value);
            let tipoPessoa = '';
    
            if (model.getValidation(true).get('PESSOAS_CPFCNPJ') !== true) {
                Ext.defer(txtCpf.focus, 100, txtCpf, [true]);
                throw model.getValidation(true).get('PESSOAS_CPFCNPJ');
            }
            
            if (!model.phantom || this.ignoreDocument(model)) {
                return
            }
            
            view.initGauge('Verificando disponibilidade CPF/CNPJ...');

            if(configs.getClientName() == 'prudenmoveis') {
                tipoPessoa = 'A'; // Checa só clientes
            }

            const queryCPF = await SamosUtils.Request.nodeApi({
                url: `/consultas/existe`,
                method: 'GET',
                query: {
                    tabela: 'PESSOAS',
                    campo: 'PESSOAS_CPFCNPJ',
                    conteudo: cpfCnpjInformado,
                    tipo: tipoPessoa
                }
            });

            if (queryCPF.results[0]) {
                const pessoasId = queryCPF.results[0]['PESSOAS_ID'];
                
                if(configs.getClientName().match(/moveis/)) {
                    Movimento.services.Model.carregarCpfExistente(pessoasId);                        
                } else {
                    Ext.Note(
                        'warning', 
                        `CPF já cadastrado!<br><br>
                        <a href="#" onclick="Pessoa.services.Model.liberarCadastroCpfExistente()">
                            <font color="blue">Continuar mesmo assim</font>
                        </a> | 
                        <a href="#" onclick="Pessoa.services.Model.carregarCpfExistente(${pessoasId})">
                            <font color="blue">Carregar cadastro</font>
                        </a>`, 10000);    
                }
            } else {
                Ext.defer(proximoFoco.focus, 100, proximoFoco, [true]);
            }
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao checar CPF/CNPJ');
        }

        view.stopGauge(true);
    },

    ignoreDocument: function (model) {
        const cpfcnpj = model.get('PESSOAS_CPFCNPJ');

        return cpfcnpj == '99999999000191' || this.getViewModel().get('cadastroCpfDuplicadoLiberado');
    },

    onSairClick: function (btn, e) {
        this.getView().destroy();
    }

});
