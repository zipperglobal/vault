/*
 * Copyright (c) 2018 Zippie Ltd.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
*/

import * as utils from '../utils'

/**
 * IPCRouter creates sub iframes and forwards messages
 * for the purpose of enabling secure communication between dapps
 */
export default class IPCRouter {

  constructor() { }

  install (vault) {
    this.vault = vault
    vault.addReceiver(this)

    vault._ipc_callback_counter = 0
    vault._ipc_iframes = {}
    vault._ipc_callbacks = {}
  }

  async handleMessage(event) {
    let req = event.data
    var params = req.IPCRouterRequest
    var receiver = this._ipc_iframes[params.target]

    if(receiver !== undefined) {
      var response = await new Promise(function(resolve, reject) {
        let id = 'callback-' + this._ipc_callback_counter++
        params.payload.callback = id
        params.payload.origin = event.origin

        this._ipc_callbacks[id] = [resolve, reject]

        receiver.contentWindow.postMessage(params.payload, "*")
      }.bind(this))

      return response
    }
  }

  async handleCallback(event) {
    let req = event.data
    console.info('callback', req)
    if(req.IPCRouterRequest.callback !== undefined)
    {
      var call = this._ipc_callbacks[req.IPCRouterRequest.callback]
      delete this._ipc_callbacks[req.IPCRouterRequest.callback]

      return call[0](req.IPCRouterRequest.result);
    }
  }

  async InitIframe(event) {
    let req = event.data
    var params = req.IPCRouterRequest

    console.info('[IPCRouter]: Attempting to launch API:', params)
    if(this._ipc_iframes[params.target] === undefined) {

      let isPermitted = true // FIXME

      // Check local storage for whitelist
      /* TODO: enable whitelist check
      let whitelist = this.store.getItem('IPC-'+params.target)
  

      if(whitelist !== null) {
        let list = JSON.parse(whitelist)
  
        if(event.origin in list) {
          // then everything is ok
          console.info('[IPCRouter]: whitelist check passed')
          isPermitted = true
        }
      }
      */

      if(isPermitted === false) {
        return this.launch( window.location.href.split('#')[0] +'#?pinauth=v', {callback: req.callback, root: true})
      }

      console.info("[IPCRouter]: Creating iframe for " + params.target)
      var iframe = document.createElement('iframe')
      iframe.style.display = 'none'
  
      iframe.sandbox += ' allow-storage-access-by-user-activation'
      iframe.sandbox += ' allow-same-origin'
      iframe.sandbox += ' allow-scripts'

      // Decompose URI for parameter injection
      let uri = params.target
      let host = uri.split('#')[0]
      let hash = uri.split('#')[1]
      hash = (hash || '').split('?')[0]

      // Collect hash parameters into params object.
      let appParams = utils.hashToParams(uri)

      // Inject ipc-mode flag
      appParams['ipc-mode'] = true

      // Recombine params into paramstr for URI building
      let paramstr = ''
      Object.keys(appParams).forEach(k => {
        if (typeof(appParams[k]) === 'boolean' && appParams[k]) {
          paramstr += (paramstr.length > 0 ? ';' : '') + k
        } else {
          paramstr += (paramstr.length > 0 ? ';' : '') + k + '=' + appParams[k]
        }
      })

      // Reconstitute full application URI
      hash = hash + (paramstr.length > 0 ? '?' + paramstr : '')
      uri = host + (hash.length > 0 ? '#' + hash : '')

      iframe.src = uri
      document.body.appendChild(iframe)
  
      this._ipc_iframes[params.target] = iframe

      await new Promise(function(resolve, reject) {
        let id = 'init-'+params.target
        this._ipc_callbacks[id] = [resolve, reject]
      }.bind(this))
    }

    return
  }

  async DappConnect(event) {
    let req = event.data
    let from = req.from
    let to = req.to
    let whitelist = []

    console.info('[DappConnect]: whitelist ' + from + ' -> ' + to)

    // read existing whitelist for destination Dapp
    let db = this.store.getItem('IPC'-to)
    if(db !== null) {
      whitelist = JSON.parse(db)
    }

    whitelist[from] = true
    this.store.setItem('IPC-'+to, whitelist)
    return
  }

  dispatchTo (context, event) {
    let req = event.data
    if(context.mode === 'root') {
      // root mode receivers
      if('DappConnectRequest' in req) {
        return this.DappConnect
      }
    }
    else if('IPCRouterRequest' in req) {
      if(req.IPCRouterRequest.payload === undefined) {
        return this.handleCallback
      } else if(req.IPCRouterRequest.payload.call === 'init') {
        return this.InitIframe
      } else {
        return this.handleMessage
      }
    }

    return null;
  }
}
