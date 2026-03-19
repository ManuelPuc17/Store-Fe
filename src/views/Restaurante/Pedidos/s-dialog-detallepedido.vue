<template>
    <v-dialog v-model="open" max-width="860" scrollable>
        <v-card color="#171717" dark style="border:1px solid #2a2a2a">

            <!-- Header -->
            <v-card-title class="detalle-header">
                <div class="detalle-header-left">
                    <span class="detalle-folio">{{ folio }}</span>
                    <v-chip x-small dark :color="estatusColor" class="ml-2">{{ pedido.estatus }}</v-chip>
                </div>
                <v-spacer />
                <!-- Selector de plantilla -->
                <div class="plantilla-selector">
                    <span class="sel-label">Plantilla</span>
                    <select class="sel-input" v-model="plantillaActivaId" @change="renderPlantilla">
                        <option :value="null">— Sin plantilla —</option>
                        <option v-for="p in plantillas" :key="p.id" :value="p.id">{{ p.nombre }}</option>
                    </select>
                </div>
                <v-btn icon small class="ml-2" @click="imprimir" title="Imprimir" :disabled="!rendered">
                    <v-icon size="18">mdi-printer</v-icon>
                </v-btn>
                <v-btn icon small class="ml-1" @click="open = false">
                    <v-icon size="18">mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-card-text class="detalle-body pa-0">

                <!-- Loading -->
                <div v-if="loading" class="detalle-loading">
                    <v-progress-circular indeterminate color="#e8d5a3" size="32" />
                    <span>Cargando…</span>
                </div>

                <!-- Sin plantilla: tabla simple -->
                <div v-else-if="!plantillaActivaId" class="detalle-simple">
                    <div class="ds-section">
                        <div class="ds-row">
                            <span class="ds-key">Mesa</span>
                            <span class="ds-val">{{ pedido.mesa?.nombre || '—' }}</span>
                        </div>
                        <div class="ds-row">
                            <span class="ds-key">Fecha</span>
                            <span class="ds-val">{{ fechaFormato }}</span>
                        </div>
                        <div class="ds-row">
                            <span class="ds-key">Estatus</span>
                            <span class="ds-val">{{ pedido.estatus }}</span>
                        </div>
                    </div>
                    <div class="ds-section">
                        <span class="ds-section-title">Productos</span>
                        <v-simple-table dense dark>
                            <template v-slot:default>
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th class="text-right">Cant.</th>
                                        <th class="text-right">P.U.</th>
                                        <th class="text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="d in pedido.detalles" :key="d.id">
                                        <td>{{ d.menu?.nombre }}</td>
                                        <td class="text-right">{{ d.cantidad }}</td>
                                        <td class="text-right">${{ Number(d.precio).toFixed(2) }}</td>
                                        <td class="text-right">${{ Number(d.subtotal).toFixed(2) }}</td>
                                    </tr>
                                </tbody>
                            </template>
                        </v-simple-table>
                    </div>
                    <div class="ds-totales">
                        <div class="ds-row"><span class="ds-key">Subtotal</span><span class="ds-val">${{ subtotal
                                }}</span></div>
                        <div class="ds-row"><span class="ds-key">IVA (16%)</span><span class="ds-val">${{ iva }}</span>
                        </div>
                        <div class="ds-row ds-total"><span class="ds-key">TOTAL</span><span class="ds-val">${{
                            Number(pedido.total).toFixed(2) }}</span></div>
                    </div>
                </div>

                <!-- Con plantilla: documento renderizado -->
                <div v-else-if="rendered" class="detalle-preview-wrap">
                    <div class="detalle-preview-scroll">
                        <!-- Documento escalado -->
                        <div class="doc-outer" :style="docOuterStyle">
                            <div id="print-area" class="doc-inner" :style="docInnerStyle" v-html="renderedHtml" />
                        </div>
                    </div>
                </div>

                <!-- Error plantilla -->
                <div v-else-if="renderError" class="detalle-loading">
                    <v-icon color="error" size="32">mdi-alert-circle-outline</v-icon>
                    <span>{{ renderError }}</span>
                    <v-btn text small color="#e8d5a3" class="mt-2" @click="renderPlantilla">Reintentar</v-btn>
                </div>

            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
import axios from 'axios'

const DOC_W = 816
const DOC_H = 1056

const SAMPLE_ITEMS_FALLBACK = []

export default {
    name: 'PedidoDetalle',

    data() {
        return {
            open: false,
            loading: false,

            pedido: {},          // datos completos del pedido
            context: {},          // variables resueltas { 'pedido.mesa': '...', ... }
            items: [],          // detalles para la tabla

            plantillas: [],
            plantillaActivaId: null,  // ID de la plantilla seleccionada

            rendered: false,
            renderedHtml: '',
            renderError: '',

            // Factor de escala del doc dentro del modal
            scale: 0.6,
        }
    },

    computed: {
        URL() { return ep => `${process.env.VUE_APP_API_URL}/${ep}` },
        headers() { return { Authorization: `Bearer ${localStorage.getItem('token')}` } },

        folio() {
            return this.pedido.id
                ? '#' + String(this.pedido.id).padStart(5, '0')
                : '—'
        },

        fechaFormato() {
            if (!this.pedido.created_at) return '—'
            return new Date(this.pedido.created_at).toLocaleString('es-MX')
        },

        estatusColor() {
            const m = { pagado: 'success', cancelado: 'error', abierto: 'warning' }
            return m[this.pedido.estatus] || 'grey'
        },

        subtotal() {
            if (!this.pedido.detalles) return '0.00'
            return this.pedido.detalles.reduce((s, d) => s + Number(d.subtotal), 0).toFixed(2)
        },

        iva() {
            return (parseFloat(this.subtotal) * 0.16).toFixed(2)
        },

        docOuterStyle() {
            return {
                width: Math.round(DOC_W * this.scale) + 'px',
                height: Math.round(DOC_H * this.scale) + 'px',
                overflow: 'hidden',
                flexShrink: 0,
            }
        },

        docInnerStyle() {
            return {
                width: DOC_W + 'px',
                height: DOC_H + 'px',
                transform: `scale(${this.scale})`,
                transformOrigin: 'top left',
                background: '#fff',
                position: 'relative',
            }
        },
    },

    methods: {
        /* ── Abrir desde el padre ── */
        async abrir(pedido) {
            this.pedido = pedido
            this.rendered = false
            this.renderedHtml = ''
            this.renderError = ''
            this.context = {}
            this.items = []
            this.open = true
            this.loading = true

            await Promise.all([
                this.fetchPlantillas(),
                this.fetchContexto(pedido.id),
            ])

            this.loading = false

            if (this.plantillaActivaId) {
                await this.renderPlantilla()
            }
        },

        /* ── Cargar lista de plantillas ── */
        async fetchPlantillas() {
            try {
                const res = await axios.get(this.URL('plantillas'), { headers: this.headers })
                this.plantillas = res.data?.data || res.data || []

                // Restaurar la plantilla por defecto guardada en localStorage
                const saved = localStorage.getItem('plantilla_default_id')
                if (saved) {
                    const id = parseInt(saved)
                    if (this.plantillas.find(p => p.id === id)) {
                        this.plantillaActivaId = id
                    } else {
                        this.plantillaActivaId = this.plantillas[0]?.id || null
                    }
                } else if (this.plantillas.length) {
                    // Si no hay default guardado, tomar la primera activa
                    const activa = this.plantillas.find(p => p.activa !== false)
                    this.plantillaActivaId = activa?.id || this.plantillas[0]?.id || null
                }
            } catch (err) {
                console.error('Error cargando plantillas', err)
            }
        },

        /* ── Contexto real del pedido ── */
        async fetchContexto(pedidoId) {
            try {
                const res = await axios.get(
                    this.URL(`pedido/${pedidoId}/context`),
                    { headers: this.headers }
                )
                this.context = res.data?.data || res.data || {}
                this.items = res.data?.items || []
            } catch (err) {
                console.error('Error cargando contexto del pedido', err)
            }
        },

        /* ── Renderizar plantilla ── */
        async renderPlantilla() {
            if (!this.plantillaActivaId) {
                this.rendered = false
                return
            }

            // Guardar como plantilla por defecto
            localStorage.setItem('plantilla_default_id', this.plantillaActivaId)

            this.rendered = false
            this.renderError = ''
            this.loading = true

            try {
                const res = await axios.get(
                    this.URL(`plantillas/${this.plantillaActivaId}/render/${this.pedido.id}`),
                    { headers: this.headers }
                )

                const elementos = res.data?.data || []
                const items = res.data?.items || this.items
                const ctx = res.data?.context || this.context

                this.renderedHtml = this.buildHtml(elementos, items, ctx)
                this.rendered = true
            } catch (err) {
                console.error(err)
                this.renderError = 'No se pudo renderizar la plantilla.'
            } finally {
                this.loading = false
            }
        },

        /* ── Construir HTML del documento ── */
        buildHtml(elementos, items, ctx) {
            const resolve = text => text
                ? String(text).replace(/\{\{([^}]+)\}\}/g, (_, k) => ctx[k.trim()] ?? '')
                : ''

            const itemsNormales = items.filter(i => !i.tipo)
            const itemsEspeciales = items.filter(i => i.tipo)

            const filasProductos = itemsNormales.map(i => `
        <tr style="border-bottom:1px solid #eee">
            <td style="padding:3px 6px">${i.nombre}</td>
            <td style="padding:3px 6px;text-align:right">${i.cantidad}</td>
            <td style="padding:3px 6px;text-align:right">${i.precio}</td>
            <td style="padding:3px 6px;text-align:right">${i.subtotal}</td>
        </tr>`).join('')

            const filasEspeciales = itemsEspeciales.map(i => {
                if (i.tipo === 'linea') {
                    return `<tr><td colspan="4" style="padding:4px 0">
                <hr style="border:none;border-top:1.5px solid #222;margin:0"/>
            </td></tr>`
                }
                const estilo = i.bold
                    ? 'font-weight:700;font-size:12px;color:#111'
                    : 'color:#555;font-size:11px'
                return `<tr>
            <td colspan="3" style="padding:3px 6px;${estilo}">${i.label}</td>
            <td style="padding:3px 6px;text-align:right;${estilo}">${i.valor}</td>
        </tr>`
            }).join('')

            const itemsHtml = `
        <table style="width:100%;border-collapse:collapse;font-size:11px;color:#222">
            <thead>
                <tr style="border-bottom:1.5px solid #222">
                    <th style="padding:3px 6px;text-align:left">Producto</th>
                    <th style="padding:3px 6px;text-align:right">Cant.</th>
                    <th style="padding:3px 6px;text-align:right">P.U.</th>
                    <th style="padding:3px 6px;text-align:right">Subtotal</th>
                </tr>
            </thead>
            <tbody>${filasProductos}${filasEspeciales}</tbody>
        </table>`

            const totalsHtml = `
        <table style="width:100%;border-collapse:collapse;color:#333;font-size:12px">
            <tr><td style="padding:2px 6px;color:#666">Subtotal</td><td style="text-align:right;padding:2px 6px">${ctx['pedido.subtotal'] || ''}</td></tr>
            <tr><td style="padding:2px 6px;color:#666">IVA (16%)</td><td style="text-align:right;padding:2px 6px">${ctx['pedido.iva'] || ''}</td></tr>
            <tr><td style="padding:2px 6px;color:#666">Descuento</td><td style="text-align:right;padding:2px 6px">${ctx['pedido.descuento'] || ''}</td></tr>
            <tr style="border-top:1.5px solid #222;font-weight:700">
                <td style="padding:5px 6px">TOTAL</td>
                <td style="text-align:right;padding:5px 6px;font-size:14px">${ctx['pedido.total'] || ''}</td>
            </tr>
        </table>`

            // Ordenar por Y ascendente para respetar el orden visual
            const ordenados = [...elementos].sort((a, b) => a.y - b.y)

            return ordenados.map((el, idx) => {
                const bg = el.bg && el.bg !== 'transparent' ? `background:${el.bg};` : ''
                let inner = ''

                if (['h1', 'h2', 'p', 'text'].includes(el.type)) {
                    const tag = el.type === 'text' ? 'span' : el.type
                    const ts = [
                        `font-size:${el.fontSize}px`, `font-weight:${el.fontWeight}`,
                        `font-family:${el.fontFamily}`, `color:${el.color}`,
                        `text-align:${el.align}`, `display:block`, `width:100%`,
                        `line-height:1.5`, `word-break:break-word`, `margin:0`,
                    ].join(';')
                    inner = `<${tag} style="${ts}">${resolve(el.content)}</${tag}>`
                } else if (el.type === 'img') {
                    inner = `<img src="${el.src || ''}" style="width:100%;height:100%;object-fit:${el.objectFit || 'contain'};display:block"/>`
                } else if (el.type === 'hr') {
                    inner = `<hr style="border:none;border-top:1.5px solid ${el.color};margin:0;width:100%"/>`
                } else if (el.type === 'items') {
                    inner = itemsHtml
                } else if (el.type === 'totals') {
                    inner = totalsHtml
                }

                // Calcular margen superior desde el elemento anterior
                const prev = idx > 0 ? ordenados[idx - 1] : null
                const marginTop = prev ? Math.max(0, el.y - prev.y - prev.h) : el.y

                return `<div style="
            position:relative;
            margin-top:${marginTop}px;
            margin-left:${el.x}px;
            width:${el.w}px;
            ${el.type === 'items' ? 'height:auto' : `height:${el.h}px`};
            padding:4px 6px;
            ${bg}
            ${el.type === 'items' ? 'overflow:visible' : 'overflow:hidden'}
        ">${inner}</div>`
            }).join('')
        },

        /* ── Imprimir ── */
        imprimir() {
            const contenido = document.getElementById('print-area')?.innerHTML
            if (!contenido) return

            const win = window.open('', '_blank', 'width=900,height=1100')
            win.document.write(`<!DOCTYPE html>
        <html>
          <head>
            <title>Pedido ${this.folio}</title>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { width: ${DOC_W}px; }
              @media print {
                body { margin: 0; }
                @page { size: letter; margin: 0; }
              }
            </style>
          </head>
          <body>${contenido}</body>
        </html>`)
            win.document.close()
            win.focus()
            setTimeout(() => { win.print(); win.close() }, 400)
        },
    },
}
</script>

<style scoped>
/* Header */
.detalle-header {
    display: flex;
    align-items: center;
    padding: 12px 16px !important;
    border-bottom: 1px solid #2a2a2a;
    flex-wrap: wrap;
    gap: 8px;
}

.detalle-header-left {
    display: flex;
    align-items: center;
}

.detalle-folio {
    font-family: monospace;
    font-size: 15px;
    font-weight: 700;
    color: #e8d5a3;
    letter-spacing: .05em;
}

/* Selector plantilla */
.plantilla-selector {
    display: flex;
    align-items: center;
    gap: 8px;
}

.sel-label {
    font-size: 10px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: .1em;
    white-space: nowrap;
}

.sel-input {
    background: #1e1e1e;
    border: 1px solid #333;
    border-radius: 4px;
    color: #f0ede8;
    font-size: 12px;
    padding: 4px 8px;
    outline: none;
    cursor: pointer;
    transition: border-color .15s;
    max-width: 180px;
}

.sel-input:focus {
    border-color: #c9a96e;
}

.sel-input option {
    background: #1e1e1e;
}

/* Body */
.detalle-body {
    min-height: 300px;
}

/* Loading / error */
.detalle-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 300px;
    color: #666;
    font-size: 13px;
}

/* Vista simple (sin plantilla) */
.detalle-simple {
    padding: 20px 24px;
}

.ds-section {
    margin-bottom: 20px;
}

.ds-section-title {
    display: block;
    font-size: 10px;
    color: #555;
    text-transform: uppercase;
    letter-spacing: .12em;
    margin-bottom: 8px;
    font-weight: 600;
}

.ds-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
    border-bottom: 1px solid #222;
}

.ds-key {
    font-size: 12px;
    color: #888;
}

.ds-val {
    font-size: 12px;
    color: #f0ede8;
    font-weight: 500;
}

.ds-totales {
    margin-top: 16px;
    max-width: 280px;
    margin-left: auto;
}

.ds-total {
    border-top: 1.5px solid #444 !important;
}

.ds-total .ds-key,
.ds-total .ds-val {
    font-weight: 700;
    font-size: 14px;
    color: #e8d5a3 !important;
}

/* Preview con plantilla */
.detalle-preview-wrap {
    display: flex;
    justify-content: center;
    padding: 24px 16px;
    background: #0f0f0f;
    min-height: 400px;
}

.detalle-preview-scroll {
    display: flex;
    justify-content: center;
}

.doc-outer {
    box-shadow: 0 8px 32px rgba(0, 0, 0, .6), 0 0 0 1px rgba(0, 0, 0, .3);
    border-radius: 2px;
}

.doc-inner {
    font-family: sans-serif;
}
</style>