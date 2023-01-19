'use strict';
'require dom';
'require form';
'require fs';
'require ui';
'require uci';
'require view';

/*
	Copyright 2022-2023 Rafał Wabik - IceG - From eko.one.pl forum
	
	Licensed to the GNU General Public License v3.0.
*/


return view.extend({
	handleCommand: function(exec, args) {
		var buttons = document.querySelectorAll('.cbi-button');

		for (var i = 0; i < buttons.length; i++)
			buttons[i].setAttribute('disabled', 'true');

		return fs.exec(exec, args).then(function(res) {
			var out = document.querySelector('.atcommand-output');
			out.style.display = '';

			res.stdout = res.stdout.replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, "")
			
			var cut = res.stdout;
			if (cut.includes('error: 0')) {
        		res.stdout = _('Phone/Modem failure.');
			}
			if (cut.includes('error: 1')) {
        		res.stdout = _('No connection to phone.');
			}
			if (cut.includes('error: 2')) {
        		res.stdout = _('Phone/Modem adapter link reserved.');
			}
			if (cut.includes('error: 3')) {
        		res.stdout = _('Operation not allowed.');
			}
			if (cut.includes('error: 4')) {
        		res.stdout = _('Operation not supported.');
			}
			if (cut.includes('error: 5')) {
        		res.stdout = _('PH_SIM PIN required.');
			}
			if (cut.includes('error: 6')) {
        		res.stdout = _('PH_FSIM PIN required.');
			}
			if (cut.includes('error: 7')) {
        		res.stdout = _('PH_FSIM PUK required.');
			}
			if (cut.includes('error: 10')) {
        		res.stdout = _('SIM not inserted.');
			}
			if (cut.includes('error: 11')) {
        		res.stdout = _('SIM PIN required.');
			}
			if (cut.includes('error: 12')) {
        		res.stdout = _('SIM PUK required.');
			}
			if (cut.includes('error: 13')) {
        		res.stdout = _('SIM failure.');
			}
			if (cut.includes('error: 14')) {
        		res.stdout = _('SIM busy.');
			}
			if (cut.includes('error: 15')) {
        		res.stdout = _('SIM wrong.');
			}
			if (cut.includes('error: 16')) {
        		res.stdout = _('Incorrect password.');
			}
			if (cut.includes('error: 17')) {
        		res.stdout = _('SIM PIN2 required.');
			}
			if (cut.includes('error: 18')) {
        		res.stdout = _('SIM PUK2 required.');
			}
			
						
			dom.content(out, [ res.stdout || '', res.stderr || '' ]);
			
		}).catch(function(err) {
			ui.addNotification(null, E('p', [ err ]))
		}).finally(function() {
			for (var i = 0; i < buttons.length; i++)
			buttons[i].removeAttribute('disabled');

		});
	},

	handleGo: function(ev) {

		var port, ussd = document.getElementById('cmdvalue').value;
		var sections = uci.sections('sms_tool_js');
		var port = sections[0].ussdport;
		var get_ussd = sections[0].ussd;
		var get_pdu = sections[0].pdu;

		if ( ussd.length < 2 )
		{
			ui.addNotification(null, E('p', _('Please specify the code to send')), 'info');
			return false;
		}
		else {

		if ( !port )
			{
			ui.addNotification(null, E('p', _('Please set the port for communication with the modem')), 'info');
			return false;
			}
			else {
			if ( get_ussd == '1' && get_pdu == '1')
				{
				//ussd + pdu
				return this.handleCommand('sms_tool', [ '-d' , port , '-R' , '-r' , 'ussd' , ussd ]);
				}
			if ( get_ussd == '1' && get_pdu == '0')
				{
				//ussd
				return this.handleCommand('sms_tool', [ '-d' , port , '-R' , 'ussd' , ussd ]);
				}
			if ( get_ussd == '0' && get_pdu == '1')
				{
				//pdu
				return this.handleCommand('sms_tool', [ '-d' , port , '-r' , 'ussd' , ussd ]);
				}
			}
		}

		if ( !port )
		{
			ui.addNotification(null, E('p', _('Please set the port for communication with the modem')), 'info');
			return false;
		}
	},

	handleClear: function(ev) {
		var out = document.querySelector('.atcommand-output');
		out.style.display = 'none';

		var ov = document.getElementById('cmdvalue');
		ov.value = '';

		document.getElementById('cmdvalue').focus();
	},

	handleCopy: function(ev) {
		var out = document.querySelector('.atcommand-output');
		out.style.display = 'none';

		var ov = document.getElementById('cmdvalue');
		ov.value = '';
		var x = document.getElementById('tk').value;
		ov.value = x;
	},

	load: function() {
		return Promise.all([
			L.resolveDefault(fs.read_direct('/etc/modem/ussdcodes.user'), null),
			uci.load('sms_tool_js')
		]);
	},

	render: function (loadResults) {
	
	var info = _('User interface for sending USSD codes using sms-tool. More information about the sms-tool on the %seko.one.pl forum%s.').format('<a href="https://eko.one.pl/?p=openwrt-sms_tool" target="_blank">', '</a>');
	
		return E('div', { 'class': 'cbi-map', 'id': 'map' }, [
				E('h2', {}, [ _('USSD Codes') ]),
				E('div', { 'class': 'cbi-map-descr'}, info),
				E('hr'),
				E('div', { 'class': 'cbi-section' }, [
					E('div', { 'class': 'cbi-section-node' }, [
						E('div', { 'class': 'cbi-value' }, [
							E('label', { 'class': 'cbi-value-title' }, [ _('User USSD codes') ]),
							E('div', { 'class': 'cbi-value-field' }, [
								E('select', { 'class': 'cbi-input-select', 'id': 'tk', 'style': 'margin:5px 0; width:100%;', 'change': ui.createHandlerFn(this, 'handleCopy')},
									(loadResults[0] || "").trim().split("\n").map(function(cmd) {
										var fields = cmd.split(/;/);
										var name = fields[0];
										var code = fields[1];
									return E('option', { 'value': code }, name ) })
								)
							]) 
						]),
						E('div', { 'class': 'cbi-value' }, [
							E('label', { 'class': 'cbi-value-title' }, [ _('Code to send') ]),
							E('div', { 'class': 'cbi-value-field' }, [
							E('input', {
								'style': 'margin:5px 0; width:100%;',
								'type': 'text',
								'id': 'cmdvalue',
								'data-tooltip': _('Press [Enter] to send the code, press [Delete] to delete the code'),
								'keydown': function(ev) {
									 if (ev.keyCode === 13)  
										{
										var execBtn = document.getElementById('execute');
											if (execBtn)
												execBtn.click();
										}
									 if (ev.keyCode === 46)  
										{
										var del = document.getElementById('cmdvalue');
											if (del)
												var ov = document.getElementById('cmdvalue');
												ov.value = '';
												document.getElementById('cmdvalue').focus();
										}
								}																														
								}),
							])
						]),

					])
				]),
				E('hr'),
				E('div', { 'class': 'right' }, [
					E('button', {
						'class': 'cbi-button cbi-button-remove',
						'id': 'clr',
						'click': ui.createHandlerFn(this, 'handleClear')
					}, [ _('Clear form') ]),
					'\xa0\xa0\xa0',
					E('button', {
						'class': 'cbi-button cbi-button-action important',
						'id': 'execute',
						'click': ui.createHandlerFn(this, 'handleGo')
					}, [ _('Send code') ]),
				]),
				E('p', _('Reply')),
				E('pre', { 'class': 'atcommand-output', 'style': 'display:none; border: 1px solid var(--border-color-medium); border-radius: 5px; font-family: monospace' }),

			]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
})
