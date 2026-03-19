<template>
    <v-app class="editor-app">

        <!-- ── TOPBAR ── -->
        <v-app-bar flat height="48" color="#171717" style="border-bottom:1px solid #2a2a2a; z-index:200">
            <span class="brand">Plantillas</span>
            <div class="top-divider" />
            <input v-model="templateName" class="tpl-name-input" placeholder="Nombre de plantilla…" />
            <v-spacer />
            <v-btn text small class="btn-ghost" @click="loadDialog = true">Cargar</v-btn>
            <v-btn text small class="btn-preview ml-2" @click="openPreview">Vista previa</v-btn>
            <v-btn small class="btn-accent ml-2" :loading="saving" @click="saveTemplate">
                Guardar plantilla
            </v-btn>
        </v-app-bar>

        <div class="editor-layout">

            <!-- ── LEFT PANEL ── -->
            <div class="left-panel">
                <div class="panel-section">
                    <span class="panel-label">Elementos</span>
                    <div class="elem-list">
                        <div v-for="et in ELEMENT_TYPES" :key="et.type" class="elem-btn" draggable="true"
                            @dragstart="startElemDrag($event, et.type)">
                            <span class="elem-icon">{{ et.icon }}</span>{{ et.label }}
                        </div>
                    </div>
                </div>

                <span class="panel-label" style="padding:12px 12px 4px;flex-shrink:0">Variables</span>
                <div class="var-list">
                    <template v-for="group in VAR_GROUPS">
                        <div class="var-group-label" :key="'g-' + group.label">{{ group.label }}</div>
                        <div v-for="v in group.vars" :key="group.label + '-' + v.token" class="var-chip"
                            draggable="true" @dragstart="startVarDrag($event, v.token)">
                            <span class="var-chip-token">{{ v.token }}</span>
                            <span class="var-chip-desc">{{ v.desc }}</span>
                        </div>
                    </template>
                </div>
            </div>

            <!-- ── CANVAS ── -->
            <div class="canvas-area" ref="canvasArea" @pointerdown="onCanvasDown" @pointermove="onPointerMove"
                @pointerup="onPointerUp" @wheel.prevent="onWheel" @contextmenu.prevent @click="onCanvasClick"
                @dragover.prevent @drop.prevent>
                <canvas ref="bgCanvas" class="bg-canvas" />
                <div class="doc-sheet" ref="docSheet" :style="docSheetStyle" @click.self="deselect" @dragover.prevent
                    @drop.prevent="onDocDrop">
                    <div class="zone-line" :style="{ top: HEAD_H + 'px' }" />
                    <div class="zone-line" :style="{ top: (HEAD_H + BODY_H) + 'px' }" />
                    <div v-for="el in elements" :key="el.id" class="doc-el" :data-id="el.id"
                        :class="{ 'doc-el--selected': el.id === selectedId, 'doc-el--moving': draggingId === el.id }"
                        :style="elStyle(el)" @pointerdown="onElDown($event, el.id)"
                        @dblclick="onElDblClick($event, el.id)">
                        <component v-if="isText(el.type)" :is="elTag(el.type)" class="el-inner" :style="textStyle(el)"
                            v-html="highlightVars(el.content)" />
                        <img v-else-if="el.type === 'img'" :src="el.src || 'https://placehold.co/200x80?text=Logo'"
                            :style="{ width: '100%', height: '100%', objectFit: el.objectFit || 'contain', display: 'block' }" />
                        <hr v-else-if="el.type === 'hr'"
                            :style="{ border: 'none', borderTop: '1.5px solid ' + el.color, margin: 0, width: '100%' }" />
                        <table v-else-if="el.type === 'items'" class="items-table"
                            :style="{ fontSize: el.fontSize + 'px' }">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th class="num">Cant.</th>
                                    <th class="num">P.U.</th>
                                    <th class="num">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, i) in SAMPLE_ITEMS" :key="i">
                                    <td>{{ item.nombre }}</td>
                                    <td class="num">{{ item.cantidad }}</td>
                                    <td class="num">{{ item.precio }}</td>
                                    <td class="num">{{ item.subtotal }}</td>
                                </tr>
                            </tbody>
                        </table>
                        <table v-else-if="el.type === 'totals'" class="totals-table"
                            :style="{ fontSize: el.fontSize + 'px' }">
                            <tr>
                                <td class="tot-lbl">Subtotal</td>
                                <td class="tot-val"><span class="var-inline">{{ pedido.subtotal }}</span></td>
                            </tr>
                            <tr>
                                <td class="tot-lbl">IVA (16%)</td>
                                <td class="tot-val"><span class="var-inline">{{ pedido.iva }}</span></td>
                            </tr>
                            <tr>
                                <td class="tot-lbl">Descuento</td>
                                <td class="tot-val"><span class="var-inline">{{ pedido.descuento }}</span></td>
                            </tr>
                            <tr class="tot-final">
                                <td>TOTAL</td>
                                <td class="tot-val"><span class="var-inline">{{ pedido.total }}</span></td>
                            </tr>
                        </table>
                        <div class="pos-badge">{{ Math.round(el.x) }}, {{ Math.round(el.y) }}</div>
                        <div v-for="dir in ['nw', 'ne', 'sw', 'se']" :key="dir" :class="['rh', dir]"
                            @pointerdown.stop="onResizeDown($event, el.id, dir)" />
                    </div>
                </div>
            </div>

            <!-- ── RIGHT PANEL ── -->
            <div class="right-panel">
                <div class="panel-section" style="flex-shrink:0">
                    <span class="panel-label">Propiedades</span>
                </div>
                <div class="props-scroll">
                    <div v-if="!selectedEl" class="no-sel">
                        Arrastra elementos al documento o selecciona uno para editar sus propiedades.
                    </div>
                    <template v-else>
                        <div class="prop-group">
                            <span class="prop-label">Posición</span>
                            <div class="prop-row2">
                                <input class="prop-input" type="number" placeholder="X"
                                    :value="Math.round(selectedEl.x)" @input="setProp('x', +$event.target.value)" />
                                <input class="prop-input" type="number" placeholder="Y"
                                    :value="Math.round(selectedEl.y)" @input="setProp('y', +$event.target.value)" />
                            </div>
                        </div>
                        <div class="prop-group">
                            <span class="prop-label">Tamaño</span>
                            <div class="prop-row2">
                                <input class="prop-input" type="number" placeholder="W"
                                    :value="Math.round(selectedEl.w)" @input="setProp('w', +$event.target.value)" />
                                <input class="prop-input" type="number" placeholder="H"
                                    :value="Math.round(selectedEl.h)" @input="setProp('h', +$event.target.value)" />
                            </div>
                        </div>
                        <template v-if="isText(selectedEl.type)">
                            <div class="prop-group">
                                <span class="prop-label">Contenido</span>
                                <textarea class="prop-input" rows="3" :value="selectedEl.content"
                                    @input="setProp('content', $event.target.value)" />
                            </div>
                            <div class="prop-group">
                                <span class="prop-label">Insertar variable</span>
                                <div class="var-insert-grid">
                                    <span v-for="v in ALL_VARS" :key="v" class="var-insert-chip" @click="insertVar(v)">
                                        {{ v.replace(/[{}]/g, '') }}
                                    </span>
                                </div>
                            </div>
                            <div class="prop-group">
                                <span class="prop-label">Tamaño fuente</span>
                                <input class="prop-input" type="number" :value="selectedEl.fontSize"
                                    @input="setProp('fontSize', +$event.target.value)" />
                            </div>
                            <div class="prop-group">
                                <span class="prop-label">Familia</span>
                                <select class="prop-input" :value="selectedEl.fontFamily"
                                    @change="setProp('fontFamily', $event.target.value)">
                                    <option v-for="f in FONT_FAMILIES" :key="f" :value="f">{{ f }}</option>
                                </select>
                            </div>
                            <div class="prop-group">
                                <span class="prop-label">Peso</span>
                                <select class="prop-input" :value="selectedEl.fontWeight"
                                    @change="setProp('fontWeight', $event.target.value)">
                                    <option v-for="w in ['300', '400', '500', '600', '700']" :key="w" :value="w">{{ w }}
                                    </option>
                                </select>
                            </div>
                            <div class="prop-group">
                                <span class="prop-label">Alineación</span>
                                <div class="align-btns">
                                    <button v-for="a in ['left', 'center', 'right']" :key="a" class="align-btn"
                                        :class="{ 'align-btn--active': selectedEl.align === a }"
                                        @click="setProp('align', a)">
                                        {{ a === 'left' ? '⬅' : a === 'center' ? '↔' : '➡' }}
                                    </button>
                                </div>
                            </div>
                            <div class="prop-group">
                                <span class="prop-label">Color texto</span>
                                <div class="prop-color-row">
                                    <input type="color" class="color-swatch" :value="selectedEl.color"
                                        @input="setProp('color', $event.target.value)" />
                                    <input class="prop-input" :value="selectedEl.color"
                                        @input="setProp('color', $event.target.value)" />
                                </div>
                            </div>
                        </template>
                        <template v-if="selectedEl.type === 'img'">
                            <div class="prop-group">
                                <span class="prop-label">URL imagen</span>
                                <input class="prop-input" :value="selectedEl.src"
                                    @input="setProp('src', $event.target.value)" placeholder="https://…" />
                            </div>
                            <div class="prop-group">
                                <span class="prop-label">Subir archivo</span>
                                <input class="prop-input" type="file" accept="image/*" @change="uploadImg" />
                            </div>
                            <div class="prop-group">
                                <span class="prop-label">Ajuste</span>
                                <select class="prop-input" :value="selectedEl.objectFit"
                                    @change="setProp('objectFit', $event.target.value)">
                                    <option v-for="f in ['contain', 'cover', 'fill']" :key="f">{{ f }}</option>
                                </select>
                            </div>
                        </template>
                        <template v-if="selectedEl.type === 'hr'">
                            <div class="prop-group">
                                <span class="prop-label">Color línea</span>
                                <div class="prop-color-row">
                                    <input type="color" class="color-swatch" :value="selectedEl.color"
                                        @input="setProp('color', $event.target.value)" />
                                    <input class="prop-input" :value="selectedEl.color"
                                        @input="setProp('color', $event.target.value)" />
                                </div>
                            </div>
                        </template>
                        <div v-if="selectedEl.type !== 'hr'" class="prop-group">
                            <span class="prop-label">Fondo</span>
                            <div class="prop-color-row">
                                <input type="color" class="color-swatch"
                                    :value="selectedEl.bg && selectedEl.bg !== 'transparent' ? selectedEl.bg : '#ffffff'"
                                    @input="setProp('bg', $event.target.value)" />
                                <input class="prop-input" :value="selectedEl.bg || 'transparent'"
                                    @input="setProp('bg', $event.target.value)" />
                            </div>
                        </div>
                        <div class="prop-group">
                            <button class="btn-danger" @click="deleteEl">Eliminar elemento</button>
                        </div>
                    </template>
                </div>

                <!-- Saved -->
                <div class="saved-section">
                    <span class="panel-label">Plantillas guardadas</span>
                    <div class="saved-list">
                        <div v-if="!savedTemplates.length" class="no-sel" style="font-size:11px">Ninguna guardada aún
                        </div>
                        <div v-for="tpl in savedTemplates" :key="tpl.id || tpl.nombre" class="saved-item"
                            @click="loadTemplate(tpl)">
                            <span class="saved-item-name">{{ tpl.nombre }}</span>
                            <span class="saved-item-type">{{ tpl.tipo }}</span>
                            <span class="saved-item-del" @click.stop="deleteSaved(tpl)">×</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── PREVIEW DIALOG ── -->
        <v-dialog v-model="previewOpen" max-width="1020" scrollable>
            <v-card color="#171717" dark style="border:1px solid #2a2a2a">
                <v-card-title class="modal-title-bar">
                    Vista Previa
                    <v-spacer />
                    <v-btn icon small @click="previewOpen = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-card-title>
                <v-card-text style="padding:20px">
                    <div class="preview-body">

                        <!-- Doc scaled -->
                        <div :style="previewWrapStyle">
                            <div class="preview-doc" :style="previewDocStyle" v-html="previewHtml" />
                        </div>

                        <!-- Panel derecho del modal -->
                        <div class="preview-side">

                            <!-- Selector de pedido real -->
                            <div class="prop-group">
                                <span class="panel-label" style="margin-bottom:8px">Pedido real</span>
                                <select class="prop-input" v-model="selectedPedidoId" @change="fetchPedidoContext">
                                    <option :value="null">— Selecciona un pedido —</option>
                                    <option v-for="p in pedidosDisponibles" :key="p.id" :value="p.id">
                                        #{{ String(p.id).padStart(5, '0') }} · {{ p.mesa }} · {{ p.estatus }}
                                    </option>
                                </select>
                                <div v-if="loadingContext" class="loading-context">
                                    <v-progress-circular indeterminate size="16" width="2" color="#e8d5a3" />
                                    Cargando datos…
                                </div>
                            </div>

                            <!-- Contexto resuelto (editable para ajuste fino) -->
                            <div v-if="previewContext" class="prop-group">
                                <span class="panel-label" style="margin-bottom:8px">Variables resueltas</span>
                                <div v-for="(val, key) in previewContext" :key="key" class="ctx-row">
                                    <span class="ctx-key">{{ key }}</span>
                                    <input class="prop-input ctx-val" :value="val"
                                        @input="onContextEdit(key, $event.target.value)" />
                                </div>
                            </div>

                            <!-- Sin pedido: datos de muestra editables -->
                            <div v-else class="prop-group">
                                <span class="panel-label" style="margin-bottom:8px">Datos de muestra</span>
                                <div v-for="field in SAMPLE_FIELDS" :key="field.key" style="margin-bottom:6px">
                                    <span class="prop-label">{{ field.label }}</span>
                                    <input class="prop-input" v-model="sampleData[field.key]" @input="buildPreview" />
                                </div>
                            </div>

                            <!-- Items reales -->
                            <div v-if="previewItems.length" class="prop-group">
                                <span class="panel-label" style="margin-bottom:6px">Items del pedido</span>
                                <table class="ctx-items-table">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cant.</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(item, i) in previewItems" :key="i">
                                            <td>{{ item.nombre }}</td>
                                            <td>{{ item.cantidad }}</td>
                                            <td>{{ item.subtotal }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- Payload JSON -->
                            <div class="panel-label" style="margin:10px 0 6px">Payload → Laravel</div>
                            <pre class="json-view">{{ jsonPayload }}</pre>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- ── LOAD DIALOG ── -->
        <v-dialog v-model="loadDialog" max-width="420">
            <v-card color="#171717" dark style="border:1px solid #2a2a2a">
                <v-card-title class="modal-title-bar">
                    Cargar plantilla
                    <v-spacer />
                    <v-btn icon small @click="loadDialog = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-card-title>
                <v-card-text style="padding:16px; max-height:400px; overflow-y:auto">
                    <div v-if="!savedTemplates.length" class="no-sel">No hay plantillas guardadas.</div>
                    <div v-for="tpl in savedTemplates" :key="tpl.id || tpl.nombre" class="saved-item"
                        style="margin-bottom:6px" @click="loadTemplate(tpl); loadDialog = false">
                        <span class="saved-item-name">{{ tpl.nombre }}</span>
                        <span class="saved-item-type">{{ tpl.tipo }}</span>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- ── SNACKBAR ── -->
        <v-snackbar v-model="toastVisible" :timeout="2200" bottom color="#e8d5a3" light>
            <span style="color:#0f0f0f;font-weight:600">{{ toastMsg }}</span>
        </v-snackbar>

    </v-app>
</template>

<script>
import axios from 'axios'

/* ─── Constants ─── */
const DOC_W = 816
const DOC_H = 1056
const HEAD_H = 115
const BODY_H = DOC_H - HEAD_H - 96
const MARGIN = 72

const ELEMENT_TYPES = [
    { type: 'h1', icon: 'H1', label: 'Título' },
    { type: 'h2', icon: 'H2', label: 'Subtítulo' },
    { type: 'p', icon: 'P', label: 'Párrafo' },
    { type: 'text', icon: 'T', label: 'Texto libre' },
    { type: 'img', icon: 'IMG', label: 'Logo / Imagen' },
    { type: 'hr', icon: '—', label: 'Línea' },
    { type: 'items', icon: '⊞', label: 'Tabla de items' },
    { type: 'totals', icon: 'Σ', label: 'Bloque totales' },
]

const VAR_GROUPS = [
    {
        label: 'Negocio', vars: [
            { token: '{{negocio.nombre}}', desc: 'Nombre' },
            { token: '{{negocio.direccion}}', desc: 'Dirección' },
            { token: '{{negocio.telefono}}', desc: 'Teléfono' },
            { token: '{{negocio.rfc}}', desc: 'RFC' },
        ]
    },
    {
        label: 'Pedido', vars: [
            { token: '{{pedido.folio}}', desc: 'Folio' },
            { token: '{{pedido.fecha}}', desc: 'Fecha' },
            { token: '{{pedido.hora}}', desc: 'Hora' },
            { token: '{{pedido.mesa}}', desc: 'Mesa' },
            { token: '{{pedido.mesero}}', desc: 'Mesero' },
            { token: '{{pedido.estatus}}', desc: 'Estatus' },
        ]
    },
    {
        label: 'Totales', vars: [
            { token: '{{pedido.subtotal}}', desc: 'Subtotal' },
            { token: '{{pedido.iva}}', desc: 'IVA' },
            { token: '{{pedido.descuento}}', desc: 'Descuento' },
            { token: '{{pedido.total}}', desc: 'Total' },
        ]
    },
]

const ALL_VARS = VAR_GROUPS.flatMap(g => g.vars.map(v => v.token))

const FONT_FAMILIES = [
    'Georgia, serif',
    'Times New Roman, serif',
    'sans-serif',
    'monospace',
    'Courier New, monospace',
]

// Solo para el canvas del editor (muestra visual, no datos reales)
const SAMPLE_ITEMS = [
    { nombre: 'Cochinita Pibil', cantidad: 2, precio: '$120.00', subtotal: '$240.00' },
    { nombre: 'Agua de Jamaica 1L', cantidad: 1, precio: '$55.00', subtotal: '$55.00' },
    { nombre: 'Sopa de Lima', cantidad: 2, precio: '$85.00', subtotal: '$170.00' },
]

const SAMPLE_FIELDS = [
    { key: 'negocio.nombre', label: 'Negocio nombre' },
    { key: 'negocio.direccion', label: 'Dirección' },
    { key: 'negocio.telefono', label: 'Teléfono' },
    { key: 'negocio.rfc', label: 'RFC' },
    { key: 'pedido.folio', label: 'Folio' },
    { key: 'pedido.fecha', label: 'Fecha' },
    { key: 'pedido.hora', label: 'Hora' },
    { key: 'pedido.mesa', label: 'Mesa' },
    { key: 'pedido.mesero', label: 'Mesero' },
    { key: 'pedido.estatus', label: 'Estatus' },
    { key: 'pedido.subtotal', label: 'Subtotal' },
    { key: 'pedido.iva', label: 'IVA' },
    { key: 'pedido.descuento', label: 'Descuento' },
    { key: 'pedido.total', label: 'Total' },
]

const DEFAULTS = {
    h1: { w: 400, h: 52, content: '{{negocio.nombre}}', fontSize: 26, fontWeight: '700', fontFamily: 'Georgia, serif', color: '#111111', align: 'center', bg: 'transparent' },
    h2: { w: 320, h: 40, content: 'Subtítulo', fontSize: 16, fontWeight: '600', fontFamily: 'Georgia, serif', color: '#333333', align: 'left', bg: 'transparent' },
    p: { w: 500, h: 72, content: 'Párrafo. Variables: {{pedido.mesa}}', fontSize: 12, fontWeight: '400', fontFamily: 'sans-serif', color: '#444444', align: 'left', bg: 'transparent' },
    text: { w: 240, h: 32, content: 'Texto', fontSize: 12, fontWeight: '400', fontFamily: 'sans-serif', color: '#333333', align: 'left', bg: 'transparent' },
    img: { w: 140, h: 90, src: '', objectFit: 'contain', bg: 'transparent' },
    hr: { w: DOC_W - MARGIN * 2, h: 6, color: '#cccccc', bg: 'transparent' },
    items: { w: DOC_W - MARGIN * 2, h: 170, fontSize: 11 },
    totals: { w: 280, h: 110, fontSize: 12 },
}

export default {
    name: 'PlantillaEditor',

    data() {
        return {
            ELEMENT_TYPES, VAR_GROUPS, ALL_VARS, FONT_FAMILIES,
            SAMPLE_ITEMS, SAMPLE_FIELDS, HEAD_H, BODY_H,

            templateName: 'Recibo sin título',
            currentId: null,
            saving: false,

            elements: [],
            idCounter: 0,
            selectedId: null,
            areaW: 0, areaH: 0,

            panX: 0, panY: 0,
            isPanning: false,
            panStart: { x: 0, y: 0 },
            panOrigin: { x: 0, y: 0 },

            draggingId: null,
            dragOffset: { x: 0, y: 0 },
            elemDragType: null,
            varDragToken: null,

            resizingId: null,
            resizeDir: '',
            resizeStart: {},

            previewOpen: false,
            loadDialog: false,
            previewHtml: '',

            toastMsg: '',
            toastVisible: false,
            savedTemplates: [],

            // ── Preview con datos reales ──────────────────────────
            pedidosDisponibles: [],   // lista para el selector
            selectedPedidoId: null,
            loadingContext: false,
            previewContext: null, // { 'negocio.nombre': '...', ... }
            previewItems: [],   // detalles reales del pedido

            // Fallback de muestra cuando no hay pedido seleccionado
            sampleData: {
                'negocio.nombre': 'Restaurante El Sabor',
                'negocio.direccion': 'Calle Montejo 123, Mérida',
                'negocio.telefono': '999 123 4567',
                'negocio.rfc': 'REST010101AAA',
                'pedido.folio': '#00001',
                'pedido.fecha': new Date().toLocaleDateString('es-MX'),
                'pedido.hora': new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
                'pedido.mesa': 'Mesa 1',
                'pedido.mesero': 'Empleado',
                'pedido.estatus': 'Abierto',
                'pedido.subtotal': '$418.10',
                'pedido.iva': '$66.90',
                'pedido.descuento': '$0.00',
                'pedido.total': '$485.00',
            },
        }
    },

    computed: {
        selectedEl() {
            return this.elements.find(e => e.id === this.selectedId) || null
        },
        docSheetStyle() {
            return {
                left: (this.areaW - DOC_W) / 2 + this.panX + 'px',
                top: (this.areaH - DOC_H) / 2 + this.panY + 'px',
                width: DOC_W + 'px',
                height: DOC_H + 'px',
            }
        },
        previewDocStyle() {
            return {
                width: DOC_W + 'px', height: DOC_H + 'px',
                transform: `scale(${400 / DOC_W})`, transformOrigin: 'top left',
                position: 'relative', background: '#fff',
            }
        },
        previewWrapStyle() {
            return {
                width: '400px',
                height: Math.round(DOC_H * (400 / DOC_W)) + 'px',
                overflow: 'hidden', flexShrink: 0,
                borderRadius: '4px', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }
        },
        jsonPayload() {
            return JSON.stringify({
                nombre: this.templateName,
                tipo: 'carta',
                elementos: this.elements.map(({ id, ...rest }) => rest),
            }, null, 2)
        },

        // Contexto activo: datos reales si hay pedido, muestra si no
        activeContext() {
            return this.previewContext || this.sampleData
        },

        // Items activos para la tabla de preview
        activeItems() {
            return this.previewItems.length ? this.previewItems : SAMPLE_ITEMS
        },
    },

    mounted() {
        this.initCanvas()
        window.addEventListener('resize', this.initCanvas)
        this.fetchSaved()
        setTimeout(() => this.toast('Arrastra elementos al documento para comenzar'), 800)
    },

    beforeDestroy() {
        window.removeEventListener('resize', this.initCanvas)
    },

    methods: {
        /* ── Canvas ── */
        initCanvas() {
            const area = this.$refs.canvasArea; if (!area) return
            this.areaW = area.clientWidth; this.areaH = area.clientHeight
            const c = this.$refs.bgCanvas
            c.width = this.areaW; c.height = this.areaH
            this.drawBG()
        },

        drawBG() {
            const c = this.$refs.bgCanvas; if (!c) return
            const ctx = c.getContext('2d')
            const { areaW: w, areaH: h, panX, panY } = this
            ctx.clearRect(0, 0, w, h)
            ctx.fillStyle = '#0f0f0f'; ctx.fillRect(0, 0, w, h)
            const step = 28
            const ox = ((panX % step) + step) % step
            const oy = ((panY % step) + step) % step
            ctx.fillStyle = 'rgba(255,255,255,0.045)'
            for (let x = ox; x < w; x += step)
                for (let y = oy; y < h; y += step)
                    ctx.fillRect(x, y, 1.5, 1.5)
        },

        /* ── Sidebar drag ── */
        startElemDrag(e, type) {
            this.elemDragType = type; this.varDragToken = null
            e.dataTransfer.effectAllowed = 'copy'
            e.dataTransfer.setData('elemType', type)
        },
        startVarDrag(e, token) {
            this.varDragToken = token; this.elemDragType = null
            e.dataTransfer.effectAllowed = 'copy'
            e.dataTransfer.setData('varToken', token)
        },

        onDocDrop(e) {
            const r = this.$refs.docSheet.getBoundingClientRect()
            const x = e.clientX - r.left, y = e.clientY - r.top
            if (this.elemDragType) {
                this.addElement(this.elemDragType, x - 80, y - 20)
                this.elemDragType = null
            } else if (this.varDragToken) {
                const target = e.target.closest('.doc-el')
                if (target) {
                    const id = +target.dataset.id
                    const el = this.elements.find(e => e.id === id)
                    if (el && this.isText(el.type))
                        this.$set(el, 'content', (el.content || '') + this.varDragToken)
                } else {
                    this.addElement('text', x - 80, y - 16, this.varDragToken)
                }
                this.varDragToken = null
            }
        },

        /* ── Add element ── */
        addElement(type, x = 80, y = 80, contentOverride = null) {
            const id = ++this.idCounter
            const def = { ...DEFAULTS[type] }
            if (contentOverride !== null && this.isText(type)) def.content = contentOverride
            this.elements.push({ id, type, x: Math.max(0, Math.round(x)), y: Math.max(0, Math.round(y)), ...def })
            this.selectedId = id
            this.toast(`${type} añadido`)
        },

        /* ── Helpers ── */
        isText(type) { return ['h1', 'h2', 'p', 'text'].includes(type) },
        elTag(type) { return type === 'text' ? 'span' : type },

        elStyle(el) {
            return {
                left: el.x + 'px', top: el.y + 'px',
                width: el.w + 'px', height: el.h + 'px',
                background: el.bg && el.bg !== 'transparent' ? el.bg : undefined,
                padding: el.type === 'hr' ? '0' : '4px 6px',
            }
        },

        textStyle(el) {
            return {
                fontSize: el.fontSize + 'px', fontWeight: el.fontWeight,
                fontFamily: el.fontFamily, color: el.color,
                textAlign: el.align, display: 'block', width: '100%',
                lineHeight: '1.5', wordBreak: 'break-word', margin: 0,
            }
        },

        highlightVars(text) {
            if (!text) return ''
            return String(text).replace(/(\{\{[^}]+\}\})/g,
                '<span class="var-inline">$1</span>')
        },

        /* ── Props ── */
        setProp(prop, val) {
            const el = this.selectedEl; if (!el) return
            this.$set(el, prop, val)
        },

        insertVar(token) {
            const el = this.selectedEl; if (!el) return
            this.$set(el, 'content', (el.content || '') + token)
        },

        deleteEl() {
            this.elements = this.elements.filter(e => e.id !== this.selectedId)
            this.selectedId = null
            this.toast('Elemento eliminado')
        },

        uploadImg(event) {
            const file = event.target.files[0]; if (!file) return
            const reader = new FileReader()
            reader.onload = e => this.setProp('src', e.target.result)
            reader.readAsDataURL(file)
        },

        deselect() { this.selectedId = null },

        /* ── Canvas events ── */
        onCanvasDown(e) {
            if (e.button === 1 || (e.button === 0 && e.altKey)) {
                this.isPanning = true
                this.panStart = { x: e.clientX, y: e.clientY }
                this.panOrigin = { x: this.panX, y: this.panY }
                this.$refs.canvasArea.setPointerCapture(e.pointerId)
                e.preventDefault()
            }
        },
        onCanvasClick(e) {
            if (e.target === this.$refs.canvasArea || e.target === this.$refs.bgCanvas) this.deselect()
        },

        onElDown(e, id) {
            if (e.target.classList.contains('rh')) return
            e.stopPropagation(); e.preventDefault()
            this.selectedId = id; this.draggingId = id
            const el = this.elements.find(e => e.id === id)
            const r = this.$refs.docSheet.getBoundingClientRect()
            this.dragOffset = { x: e.clientX - r.left - el.x, y: e.clientY - r.top - el.y }
            e.target.closest('.doc-el').setPointerCapture(e.pointerId)
        },

        onElDblClick(e, id) {
            const el = this.elements.find(el => el.id === id)
            if (!el || !this.isText(el.type)) return
            e.stopPropagation()
            this.startInlineEdit(id)
        },

        startInlineEdit(id) {
            const el = this.elements.find(e => e.id === id)
            const div = this.$refs.docSheet.querySelector(`.doc-el[data-id="${id}"] .el-inner`)
            if (!div || !el) return
            div.innerHTML = el.content || ''
            div.setAttribute('contenteditable', 'true')
            div.style.cursor = 'text'; div.focus()
            const range = document.createRange()
            range.selectNodeContents(div); range.collapse(false)
            window.getSelection().removeAllRanges()
            window.getSelection().addRange(range)
            const done = () => {
                this.$set(el, 'content', div.textContent)
                div.removeAttribute('contenteditable'); div.style.cursor = ''
                div.innerHTML = this.highlightVars(el.content)
                div.removeEventListener('keydown', onKey)
                document.removeEventListener('click', outside)
            }
            const onKey = e => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); done() } }
            const outside = e => { if (!div.contains(e.target)) done() }
            div.addEventListener('keydown', onKey)
            setTimeout(() => document.addEventListener('click', outside), 0)
        },

        onResizeDown(e, id, dir) {
            e.stopPropagation(); e.preventDefault()
            this.resizingId = id; this.resizeDir = dir
            const el = this.elements.find(e => e.id === id)
            this.resizeStart = { mx: e.clientX, my: e.clientY, l: el.x, t: el.y, w: el.w, h: el.h }
            e.target.setPointerCapture(e.pointerId)
        },

        onPointerMove(e) {
            if (this.isPanning) {
                this.panX = this.panOrigin.x + (e.clientX - this.panStart.x)
                this.panY = this.panOrigin.y + (e.clientY - this.panStart.y)
                this.drawBG(); return
            }
            if (this.draggingId) {
                const el = this.elements.find(e => e.id === this.draggingId); if (!el) return
                const r = this.$refs.docSheet.getBoundingClientRect()
                this.$set(el, 'x', Math.max(0, Math.min(e.clientX - r.left - this.dragOffset.x, DOC_W - el.w)))
                this.$set(el, 'y', Math.max(0, Math.min(e.clientY - r.top - this.dragOffset.y, DOC_H - el.h)))
                return
            }
            if (this.resizingId) {
                const el = this.elements.find(e => e.id === this.resizingId); if (!el) return
                const dx = e.clientX - this.resizeStart.mx, dy = e.clientY - this.resizeStart.my
                let { l, t, w, h } = this.resizeStart
                if (this.resizeDir.includes('e')) w = Math.max(40, w + dx)
                if (this.resizeDir.includes('s')) h = Math.max(16, h + dy)
                if (this.resizeDir.includes('w')) { w = Math.max(40, w - dx); l = this.resizeStart.l + (this.resizeStart.w - w) }
                if (this.resizeDir.includes('n')) { h = Math.max(16, h - dy); t = this.resizeStart.t + (this.resizeStart.h - h) }
                this.$set(el, 'x', Math.max(0, l))
                this.$set(el, 'y', Math.max(0, t))
                this.$set(el, 'w', Math.min(w, DOC_W - el.x))
                this.$set(el, 'h', Math.min(h, DOC_H - el.y))
            }
        },

        onPointerUp() {
            this.draggingId = null; this.isPanning = false; this.resizingId = null
        },

        onWheel(e) { this.panX -= e.deltaX * 0.5; this.panY -= e.deltaY * 0.5; this.drawBG() },

        /* ── Save / Load ── */
        buildPayload() {
            return {
                nombre: this.templateName,
                tipo: 'carta',
                elementos: this.elements.map(({ id, ...rest }) => rest),
            }
        },

        async saveTemplate() {
            if (!this.templateName.trim()) { this.toast('Escribe un nombre'); return }
            this.saving = true
            try {
                const token = localStorage.getItem('token')
                const headers = { Authorization: `Bearer ${token}` }
                const url = `${process.env.VUE_APP_API_URL}/plantillas`
                const payload = this.buildPayload()
                if (this.currentId) {
                    await axios.put(`${url}/${this.currentId}`, payload, { headers })
                } else {
                    const res = await axios.post(url, payload, { headers })
                    this.currentId = res.data?.data?.id || null
                }
                await this.fetchSaved()
                this.toast('Plantilla guardada ✓')
            } catch (err) {
                console.error(err)
                this.saveLocal()
                this.toast('Guardado localmente ✓')
            } finally {
                this.saving = false
            }
        },

        saveLocal() {
            const saved = this.getLocal()
            const key = this.templateName.toLowerCase().replace(/\s+/g, '-')
            saved[key] = { ...this.buildPayload(), savedAt: new Date().toISOString() }
            localStorage.setItem('plantillas', JSON.stringify(saved))
            this.savedTemplates = Object.values(saved)
        },

        async fetchSaved() {
            try {
                const token = localStorage.getItem('token')
                const res = await axios.get(`${process.env.VUE_APP_API_URL}/plantillas`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                this.savedTemplates = res.data?.data || res.data || []
            } catch {
                this.savedTemplates = Object.values(this.getLocal())
            }
        },

        getLocal() {
            try { return JSON.parse(localStorage.getItem('plantillas') || '{}') } catch { return {} }
        },

        loadTemplate(tpl) {
            this.templateName = tpl.nombre
            this.currentId = tpl.id || null
            this.elements = (tpl.elementos || []).map(el => ({ ...el, id: ++this.idCounter }))
            this.selectedId = null
            this.toast(`Cargado: ${tpl.nombre}`)
        },

        async deleteSaved(tpl) {
            if (tpl.id) {
                try {
                    const token = localStorage.getItem('token')
                    await axios.delete(`${process.env.VUE_APP_API_URL}/plantillas/${tpl.id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    await this.fetchSaved()
                } catch { /* ignore */ }
            } else {
                const saved = this.getLocal()
                const key = tpl.nombre.toLowerCase().replace(/\s+/g, '-')
                delete saved[key]
                localStorage.setItem('plantillas', JSON.stringify(saved))
                this.savedTemplates = Object.values(saved)
            }
            this.toast('Plantilla eliminada')
        },

        /* ── Preview con datos REALES ── */
        async openPreview() {
            this.previewOpen = true
            // Cargar lista de pedidos reales para el selector
            await this.fetchPedidosDisponibles()
            this.buildPreview()
        },

        async fetchPedidosDisponibles() {
            try {
                const token = localStorage.getItem('token')
                const res = await axios.get(`${process.env.VUE_APP_API_URL}/pedido`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const pedidos = res.data?.data || res.data || []
                // Mapear a formato simple para el selector
                this.pedidosDisponibles = pedidos.map(p => ({
                    id: p.id,
                    mesa: p.mesa?.nombre ?? 'Mesa ?',
                    estatus: p.estatus,
                    total: p.total,
                }))
            } catch (err) {
                console.error('No se pudo cargar la lista de pedidos', err)
            }
        },

        /**
         * Llamado al cambiar el selector de pedido.
         * Llama a GET /api/plantillas/{id}/render/{pedidoId}
         * Si la plantilla aún no está guardada usa el endpoint de contexto directo.
         */
        async fetchPedidoContext() {
            if (!this.selectedPedidoId) {
                this.previewContext = null
                this.previewItems = []
                this.buildPreview()
                return
            }

            this.loadingContext = true
            try {
                const token = localStorage.getItem('token')
                const headers = { Authorization: `Bearer ${token}` }

                let context, items

                if (this.currentId) {
                    // Plantilla guardada → endpoint render completo
                    const res = await axios.get(
                        `${process.env.VUE_APP_API_URL}/plantillas/${this.currentId}/render/${this.selectedPedidoId}`,
                        { headers }
                    )
                    context = res.data.context
                    items = res.data.items
                } else {
                    // Plantilla sin guardar → solo contexto del pedido
                    const res = await axios.get(
                        `${process.env.VUE_APP_API_URL}/pedido/${this.selectedPedidoId}/context`,
                        { headers }
                    )
                    context = res.data.data || res.data
                    // Obtener detalles del pedido para la tabla
                    const pedRes = await axios.get(
                        `${process.env.VUE_APP_API_URL}/pedido/${this.selectedPedidoId}`,
                        { headers }
                    )
                    const pedido = pedRes.data?.data || pedRes.data
                    items = (pedido.detalles || []).map(d => ({
                        nombre: d.menu?.nombre ?? '',
                        cantidad: d.cantidad,
                        precio: '$' + Number(d.precio).toFixed(2),
                        subtotal: '$' + Number(d.subtotal).toFixed(2),
                    }))
                }

                this.previewContext = context
                this.previewItems = items || []
                this.buildPreview()
            } catch (err) {
                console.error(err)
                this.toast('Error al cargar datos del pedido')
            } finally {
                this.loadingContext = false
            }
        },

        // Permite editar manualmente un valor del contexto en tiempo real
        onContextEdit(key, val) {
            this.$set(this.previewContext, key, val)
            this.buildPreview()
        },

        buildPreview() {
            const ctx = this.activeContext
            const items = this.activeItems

            const resolve = text => text
                ? String(text).replace(/\{\{([^}]+)\}\}/g, (_, k) => ctx[k.trim()] ?? `{{${k}}}`)
                : ''

            const itemsHtml = `
                <table style="width:100%;border-collapse:collapse;font-size:11px;color:#222">
                    <thead><tr style="border-bottom:1.5px solid #222">
                        <th style="padding:3px 5px;text-align:left">Producto</th>
                        <th style="padding:3px 5px;text-align:right">Cant.</th>
                        <th style="padding:3px 5px;text-align:right">P.U.</th>
                        <th style="padding:3px 5px;text-align:right">Subtotal</th>
                    </tr></thead>
                    <tbody>${items.map(i => `
                        <tr style="border-bottom:1px solid #eee">
                            <td style="padding:3px 5px">${i.nombre}</td>
                            <td style="padding:3px 5px;text-align:right">${i.cantidad}</td>
                            <td style="padding:3px 5px;text-align:right">${i.precio}</td>
                            <td style="padding:3px 5px;text-align:right">${i.subtotal}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>`

            const totalsHtml = `
                <table style="width:100%;border-collapse:collapse;color:#333;font-size:12px">
                    <tr><td style="padding:2px 5px;color:#666">Subtotal</td><td style="text-align:right;padding:2px 5px">${ctx['pedido.subtotal'] || ''}</td></tr>
                    <tr><td style="padding:2px 5px;color:#666">IVA (16%)</td><td style="text-align:right;padding:2px 5px">${ctx['pedido.iva'] || ''}</td></tr>
                    <tr><td style="padding:2px 5px;color:#666">Descuento</td><td style="text-align:right;padding:2px 5px">${ctx['pedido.descuento'] || ''}</td></tr>
                    <tr style="border-top:1.5px solid #222;font-weight:700">
                        <td style="padding:5px">TOTAL</td>
                        <td style="text-align:right;padding:5px;font-size:14px">${ctx['pedido.total'] || ''}</td>
                    </tr>
                </table>`

            this.previewHtml = this.elements.map(el => {
                const bgStyle = el.bg && el.bg !== 'transparent' ? `background:${el.bg};` : ''
                let inner = ''

                if (this.isText(el.type)) {
                    const ts = [
                        `font-size:${el.fontSize}px`, `font-weight:${el.fontWeight}`,
                        `font-family:${el.fontFamily}`, `color:${el.color}`,
                        `text-align:${el.align}`, `display:block`, `width:100%`,
                        `line-height:1.5`, `word-break:break-word`, `margin:0`,
                    ].join(';')
                    const tag = this.elTag(el.type)
                    inner = `<${tag} style="${ts}">${resolve(el.content)}</${tag}>`
                } else if (el.type === 'img') {
                    inner = `<img src="${el.src || 'https://placehold.co/200x80?text=Logo'}" style="width:100%;height:100%;object-fit:${el.objectFit || 'contain'};display:block"/>`
                } else if (el.type === 'hr') {
                    inner = `<hr style="border:none;border-top:1.5px solid ${el.color};margin:0;width:100%"/>`
                } else if (el.type === 'items') {
                    inner = itemsHtml
                } else if (el.type === 'totals') {
                    inner = totalsHtml
                }

                const overflow = el.type === 'items' ? 'overflow:visible' : 'overflow:hidden'
                const height   = el.type === 'items' ? `min-height:${el.h}px;height:auto` : `height:${el.h}px`
                return `<div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.w}px;${height};padding:4px 6px;${bgStyle};${overflow}">${inner}</div>`
            }).join('')
        },

        toast(msg) { this.toastMsg = msg; this.toastVisible = true },
    },
}
</script>

<style scoped>
/* (mismo CSS del archivo anterior, sin cambios) */
* {
    box-sizing: border-box;
}

.editor-app {
    font-family: 'Roboto', sans-serif !important;
    background: #0f0f0f !important;
}

.brand {
    font-size: 11px;
    color: #e8d5a3;
    letter-spacing: .15em;
    text-transform: uppercase;
    white-space: nowrap;
    margin-right: 8px;
    font-weight: 600;
}

.top-divider {
    width: 1px;
    height: 20px;
    background: #333;
    margin: 0 12px;
    flex-shrink: 0;
}

.tpl-name-input {
    background: none;
    border: 1px solid transparent;
    color: #f0ede8;
    font-size: 13px;
    font-weight: 500;
    outline: none;
    min-width: 200px;
    padding: 4px 8px;
    border-radius: 4px;
    transition: border-color .15s;
}

.tpl-name-input:hover {
    border-color: #333;
}

.tpl-name-input:focus {
    border-color: #c9a96e;
    background: #1e1e1e;
}

.btn-ghost {
    color: #888 !important;
    border: 1px solid #333 !important;
    font-size: 12px !important;
    text-transform: none !important;
    letter-spacing: 0 !important;
}

.btn-ghost:hover {
    color: #f0ede8 !important;
}

.btn-preview {
    color: #f0ede8 !important;
    border: 1px solid #333 !important;
    background: #1e1e1e !important;
    font-size: 12px !important;
    text-transform: none !important;
    letter-spacing: 0 !important;
}

.btn-preview:hover {
    border-color: #7dd3c8 !important;
    color: #7dd3c8 !important;
}

.btn-accent {
    background: #e8d5a3 !important;
    color: #0f0f0f !important;
    font-weight: 700 !important;
    font-size: 12px !important;
    text-transform: none !important;
    letter-spacing: 0 !important;
    box-shadow: none !important;
}

.btn-accent:hover {
    background: #c9a96e !important;
}

.editor-layout {
    display: grid;
    grid-template-columns: 220px 1fr 260px;
    height: calc(100vh - 48px);
    overflow: hidden;
    margin-top: 48px;
}

.left-panel {
    background: #171717;
    border-right: 1px solid #2a2a2a;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.panel-section {
    padding: 14px 12px;
    border-bottom: 1px solid #2a2a2a;
}

.panel-label {
    font-size: 9px;
    font-weight: 600;
    color: #555;
    letter-spacing: .15em;
    text-transform: uppercase;
    margin-bottom: 10px;
    display: block;
}

.elem-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.elem-btn {
    padding: 7px 10px;
    background: #1e1e1e;
    border: 1px solid #2a2a2a;
    border-radius: 5px;
    color: #888;
    font-size: 12px;
    text-align: left;
    cursor: grab;
    transition: all .15s;
    display: flex;
    align-items: center;
    gap: 9px;
    user-select: none;
}

.elem-btn:hover {
    border-color: #c9a96e;
    color: #f0ede8;
}

.elem-btn:active {
    cursor: grabbing;
}

.elem-icon {
    font-size: 9px;
    color: #555;
    width: 20px;
    text-align: center;
    flex-shrink: 0;
}

.var-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
    overflow-y: auto;
    flex: 1;
    padding: 0 12px 12px;
}

.var-list::-webkit-scrollbar {
    width: 2px;
}

.var-list::-webkit-scrollbar-thumb {
    background: #333;
}

.var-group-label {
    font-size: 9px;
    color: #555;
    letter-spacing: .1em;
    text-transform: uppercase;
    margin: 10px 0 4px;
}

.var-chip {
    padding: 5px 9px;
    background: rgba(125, 211, 200, .08);
    border: 1px solid rgba(125, 211, 200, .18);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    cursor: grab;
    transition: all .15s;
}

.var-chip:hover {
    background: rgba(125, 211, 200, .16);
    border-color: rgba(125, 211, 200, .4);
}

.var-chip:active {
    cursor: grabbing;
}

.var-chip-token {
    font-size: 10px;
    color: #7dd3c8;
    font-family: monospace;
}

.var-chip-desc {
    font-size: 9px;
    color: #555;
}

.canvas-area {
    position: relative;
    overflow: hidden;
    background: #0f0f0f;
}

.bg-canvas {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
}

.doc-sheet {
    position: absolute;
    background: #fff;
    box-shadow: 0 8px 40px rgba(0, 0, 0, .6), 0 0 0 1px rgba(0, 0, 0, .4);
    z-index: 1;
}

.zone-line {
    position: absolute;
    left: 0;
    width: 100%;
    border-top: 1px dashed rgba(0, 0, 0, .12);
    pointer-events: none;
}

.doc-el {
    position: absolute;
    cursor: grab;
    border: 1px solid transparent;
    border-radius: 2px;
    user-select: none;
}

.doc-el:hover {
    border-color: rgba(232, 213, 163, .5);
}

.doc-el--selected {
    border-color: #c9a96e !important;
    outline: 3px solid rgba(232, 213, 163, .1);
}

.doc-el:active {
    cursor: grabbing;
}

.pos-badge {
    position: absolute;
    bottom: -20px;
    right: 0;
    background: rgba(232, 213, 163, .9);
    color: #0f0f0f;
    font-size: 9px;
    font-family: monospace;
    padding: 2px 6px;
    border-radius: 3px;
    white-space: nowrap;
    pointer-events: none;
    display: none;
    z-index: 99;
}

.doc-el--selected .pos-badge,
.doc-el--moving .pos-badge {
    display: block;
}

.rh {
    position: absolute;
    width: 7px;
    height: 7px;
    background: #171717;
    border: 1.5px solid #c9a96e;
    border-radius: 1px;
    z-index: 10;
    opacity: 0;
    transition: opacity .1s;
}

.doc-el--selected .rh {
    opacity: 1;
}

.rh.se {
    bottom: -4px;
    right: -4px;
    cursor: se-resize;
}

.rh.sw {
    bottom: -4px;
    left: -4px;
    cursor: sw-resize;
}

.rh.ne {
    top: -4px;
    right: -4px;
    cursor: ne-resize;
}

.rh.nw {
    top: -4px;
    left: -4px;
    cursor: nw-resize;
}

.var-inline {
    display: inline-block;
    background: rgba(125, 211, 200, .15);
    border: 1px solid rgba(125, 211, 200, .35);
    border-radius: 3px;
    color: #3a9e95;
    font-family: monospace;
    font-size: .83em;
    padding: 0 4px;
    line-height: 1.4;
    pointer-events: none;
}

.items-table {
    width: 100%;
    border-collapse: collapse;
    color: #222;
}

.items-table th {
    font-weight: 600;
    border-bottom: 1.5px solid #222;
    padding: 3px 5px;
    text-align: left;
    font-size: .9em;
}

.items-table td {
    padding: 3px 5px;
    border-bottom: 1px solid #eee;
    color: #444;
}

.items-table .num {
    text-align: right;
}

.totals-table {
    width: 100%;
    border-collapse: collapse;
    color: #333;
}

.tot-lbl {
    padding: 2px 5px;
    color: #666;
}

.tot-val {
    text-align: right;
    padding: 2px 5px;
}

.tot-final {
    border-top: 1.5px solid #222;
    font-weight: 700;
}

.right-panel {
    background: #171717;
    border-left: 1px solid #2a2a2a;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.props-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
}

.props-scroll::-webkit-scrollbar {
    width: 2px;
}

.props-scroll::-webkit-scrollbar-thumb {
    background: #333;
}

.no-sel {
    color: #555;
    font-size: 12px;
    line-height: 1.8;
}

.prop-group {
    margin-bottom: 12px;
}

.prop-label {
    font-size: 9px;
    color: #555;
    text-transform: uppercase;
    letter-spacing: .1em;
    display: block;
    margin-bottom: 5px;
}

.prop-input {
    width: 100%;
    padding: 6px 8px;
    background: #1e1e1e;
    border: 1px solid #2a2a2a;
    border-radius: 4px;
    color: #f0ede8;
    font-size: 12px;
    outline: none;
    transition: border-color .15s;
}

.prop-input:focus {
    border-color: #c9a96e;
}

textarea.prop-input {
    resize: vertical;
    min-height: 60px;
    font-family: monospace;
    font-size: 11px;
}

select.prop-input option {
    background: #1e1e1e;
}

.prop-row2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
}

.prop-color-row {
    display: flex;
    gap: 6px;
    align-items: center;
}

.color-swatch {
    width: 32px;
    height: 30px;
    border: 1px solid #333;
    border-radius: 4px;
    padding: 0;
    cursor: pointer;
    flex-shrink: 0;
    background: none;
}

.align-btns {
    display: flex;
    gap: 4px;
}

.align-btn {
    flex: 1;
    padding: 5px 0;
    background: #1e1e1e;
    border: 1px solid #2a2a2a;
    border-radius: 4px;
    color: #666;
    cursor: pointer;
    font-size: 13px;
    transition: all .12s;
}

.align-btn:hover,
.align-btn--active {
    border-color: #c9a96e;
    color: #e8d5a3;
    background: rgba(232, 213, 163, .08);
}

.var-insert-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
}

.var-insert-chip {
    font-size: 10px;
    font-family: monospace;
    background: rgba(125, 211, 200, .08);
    border: 1px solid rgba(125, 211, 200, .2);
    border-radius: 3px;
    color: #7dd3c8;
    padding: 2px 6px;
    cursor: pointer;
    transition: all .12s;
}

.var-insert-chip:hover {
    background: rgba(125, 211, 200, .2);
}

.btn-danger {
    width: 100%;
    padding: 7px;
    background: none;
    border: 1px solid #2a2a2a;
    border-radius: 4px;
    color: #555;
    font-size: 11px;
    cursor: pointer;
    transition: all .15s;
}

.btn-danger:hover {
    border-color: #e05252;
    color: #e05252;
}

.saved-section {
    border-top: 1px solid #2a2a2a;
    padding: 12px;
}

.saved-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 130px;
    overflow-y: auto;
}

.saved-list::-webkit-scrollbar {
    width: 2px;
}

.saved-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    background: #1e1e1e;
    border: 1px solid #2a2a2a;
    border-radius: 4px;
    cursor: pointer;
    transition: all .15s;
}

.saved-item:hover {
    border-color: #c9a96e;
}

.saved-item-name {
    flex: 1;
    font-size: 12px;
    color: #f0ede8;
}

.saved-item-type {
    font-size: 9px;
    color: #555;
    font-family: monospace;
}

.saved-item-del {
    color: #555;
    font-size: 16px;
    cursor: pointer;
    transition: color .15s;
    padding: 0 2px;
    line-height: 1;
}

.saved-item-del:hover {
    color: #e05252;
}

.modal-title-bar {
    font-size: 14px !important;
    font-weight: 600 !important;
    color: #f0ede8 !important;
    border-bottom: 1px solid #2a2a2a;
    padding: 14px 18px !important;
}

.preview-body {
    display: flex;
    gap: 24px;
    align-items: flex-start;
}

.preview-doc {
    background: #fff;
}

.preview-side {
    flex: 1;
    min-width: 220px;
    max-height: 80vh;
    overflow-y: auto;
}

.preview-side::-webkit-scrollbar {
    width: 2px;
}

.preview-side::-webkit-scrollbar-thumb {
    background: #333;
}

/* Contexto resuelto */
.ctx-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 5px;
}

.ctx-key {
    font-family: monospace;
    font-size: 9px;
    color: #7dd3c8;
    white-space: nowrap;
    min-width: 120px;
}

.ctx-val {
    flex: 1;
    font-size: 11px;
}

/* Items del pedido en modal */
.ctx-items-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    color: #888;
}

.ctx-items-table th {
    font-size: 9px;
    color: #555;
    text-transform: uppercase;
    letter-spacing: .08em;
    border-bottom: 1px solid #2a2a2a;
    padding: 3px 4px;
    text-align: left;
}

.ctx-items-table td {
    padding: 3px 4px;
    border-bottom: 1px solid #222;
}

.loading-context {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: #888;
    margin-top: 6px;
}

.json-view {
    background: #1e1e1e;
    border: 1px solid #2a2a2a;
    border-radius: 6px;
    padding: 10px 12px;
    font-family: monospace;
    font-size: 10px;
    color: #888;
    white-space: pre;
    overflow: auto;
    max-height: 180px;
}

.json-view::-webkit-scrollbar {
    width: 3px;
    height: 3px;
}

.json-view::-webkit-scrollbar-thumb {
    background: #333;
}
</style>