(function (Scratch) {
    "use strict";

    if (!Scratch.extensions.unsandboxed) {
        alert("Pen must be ran unsandboxed!");
        throw new Error("Pen must run unsandboxed");
    }

    const vm = Scratch.vm;
    const runtime = vm.runtime;
    const renderer = runtime.renderer;
    const twgl = renderer.exports.twgl;

    const canvas = renderer.canvas;
    const gl = renderer._gl;
    let currentFilter = gl.NEAREST;

    let nativeSize = renderer.useHighQualityRender
        ? [canvas.width, canvas.height]
        : renderer._nativeSize;

    {
        // 深度テストを有効化（z軸方向のクリッピングとz軸を有効化）
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        const updateCanvasSize = () => {
            // きれいに描画するとき以外はstage
            nativeSize = renderer.useHighQualityRender
                ? [canvas.width, canvas.height]
                : renderer._nativeSize;

            // -1~1 に正規化
            transform_Matrix[0] = 2 / renderer._nativeSize[0];
            transform_Matrix[1] = -2 / renderer._nativeSize[1];

            // 現在のフレームバッファを記録（resize後に戻すため）
            let lastFB = gl.getParameter(gl.FRAMEBUFFER_BINDING);

            // オフスクリーン描画用フレームバッファをリサイズ
            twgl.resizeFramebufferInfo(
                gl,
                triBufferInfo,
                triBufferAttachments,
                Scratch.Cast.toNumber(nativeSize[0]),
                Scratch.Cast.toNumber(nativeSize[1])
            );

            // 描画先をオフスクリーンからフレームバッファに戻す
            gl.bindFramebuffer(gl.FRAMEBUFFER, lastFB);
        };

        // Resizeイベント用
        window.addEventListener("resize", updateCanvasSize);
        canvas.addEventListener("resize", updateCanvasSize);
        vm.runtime.on("STAGE_SIZE_CHANGED", updateCanvasSize);
        let lastCanvasSize = [canvas.clientWidth, canvas.clientHeight];
        vm.runtime.on("BEFORE_EXECUTE", () => {
            if (
                lastCanvasSize[0] != canvas.clientWidth ||
                lastCanvasSize[1] != canvas.clientHeight
            ) {
                lastCanvasSize = [canvas.clientWidth, canvas.clientHeight];
                updateCanvasSize();
            }
        });

        // 確実にpen拡張を読み込む
        if (!Scratch.vm.extensionManager.isExtensionLoaded("pen")) {
            runtime.extensionManager.loadExtensionIdSync("pen");
        }
    }

    class Scratch3NewPen {
        getInfo() {
            return {
                id: "newpen",
                name: "Pen",
                blocks: [
                    {
                        opcode: "isPenDown",
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: "Pen is down?"
                    }
                ]
            }
        }

        isPenDown(args, util) {
            const curTarget = util.target;
            const customState = curTarget._customState;
            if (customState["Scratch.pen"]) {
                return customState["Scratch.pen"].penDown;
            }
            return false;
        }
    }
    Scratch.extensions.register(new Scratch3NewPen());
})(Scratch);