"""Plantillas de correo de la casa (Fase 3b).

Los clientes de correo no entienden hojas de estilo externas ni fuentes web
fiables, así que el diseño va **inline** y con tipografías de sistema que
recuerdan a la identidad: una serif para los titulares (Playfair Display cae a
Georgia) y una sans neutra para el cuerpo (Work Sans cae a Helvetica).

Paleta: pergamino `#faf5eb`, bosque `#141d16`, terracota `#b85434`, oro `#c6a15b`.
"""

VERDE_BOSQUE = "#141d16"
PERGAMINO = "#faf5eb"
BORDE = "#ded2c1"
TERRACOTA = "#b85434"
ORO = "#c6a15b"
SEPIA = "#7a6452"
TINTA = "#1c1815"

TIPOGRAFIA_TITULO = "Georgia,'Playfair Display',serif"
TIPOGRAFIA_CUERPO = "'Work Sans',Helvetica,Arial,sans-serif"

PIE_PREDETERMINADO = (
    "Illimani Global Travel S.R.L. · Atelier de expediciones de autor<br>"
    "Av. Arce, Zona Central · La Paz, Bolivia"
)


def envoltura(*, titulo: str, cuerpo: str, pie: str = "") -> str:
    """Documento HTML completo con la cabecera y el pie de la agencia."""
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{titulo}</title>
</head>
<body style="margin:0;padding:24px;background:{PERGAMINO};font-family:{TIPOGRAFIA_CUERPO};color:{TINTA};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="width:100%;max-width:600px;background:#ffffff;border:1px solid {BORDE};border-radius:10px;overflow:hidden;">
          <tr>
            <td style="background:{VERDE_BOSQUE};padding:22px 28px;">
              <div style="font-family:{TIPOGRAFIA_TITULO};font-size:21px;color:{PERGAMINO};letter-spacing:0.02em;">
                Illimani Global Travel
              </div>
              <div style="font-family:{TIPOGRAFIA_CUERPO};font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:{ORO};margin-top:5px;">
                La Paz · Bolivia
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 14px;font-family:{TIPOGRAFIA_TITULO};font-size:24px;font-weight:normal;line-height:1.25;color:{TINTA};">
                {titulo}
              </h1>
              {cuerpo}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background:{PERGAMINO};border-top:1px solid {BORDE};font-size:11px;line-height:1.6;color:{SEPIA};">
              {pie or PIE_PREDETERMINADO}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def parrafo(texto: str) -> str:
    return (
        f'<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:{TINTA};">'
        f"{texto}</p>"
    )


def boton(*, texto: str, enlace: str) -> str:
    return (
        '<p style="margin:22px 0;">'
        f'<a href="{enlace}" style="display:inline-block;background:{TERRACOTA};'
        f'color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:999px;'
        f'font-size:13px;font-weight:bold;letter-spacing:0.04em;">{texto}</a></p>'
    )


def nota_manuscrita(texto: str) -> str:
    return (
        f'<p style="margin:18px 0 0;padding:12px 16px;background:{PERGAMINO};'
        f'border-left:3px solid {TERRACOTA};font-size:12px;font-style:italic;'
        f'line-height:1.6;color:{SEPIA};">{texto}</p>'
    )


def enlace_crudo(enlace: str) -> str:
    return (
        f'<p style="margin:0 0 14px;font-size:11px;line-height:1.6;color:{SEPIA};">'
        f"Si el botón no abre, copie esta dirección en su navegador:<br>"
        f'<span style="color:{TERRACOTA};">{enlace}</span></p>'
    )


# ---------------------------------------------------------------------
# Plantillas por evento
# ---------------------------------------------------------------------
def bienvenida(*, nombres: str) -> str:
    return envoltura(
        titulo=f"Bienvenido al cuaderno, {nombres}",
        cuerpo=(
            parrafo(
                "Su cuenta en Illimani Global Travel quedó abierta. Desde aquí puede "
                "guardar los destinos que le quitan el aliento, anotar sus preferencias "
                "de viaje y seguir el estado de sus expediciones."
            )
            + parrafo(
                "Nuestro atelier trabaja con grupos pequeños y rutas escritas a mano: "
                "cada itinerario es un cuaderno de campo que redactamos con usted."
            )
            + nota_manuscrita(
                "Consejo de la casa: empiece por el explorador de destinos y guarde "
                "aquellos que le llamen. Con eso afinamos sus recomendaciones."
            )
        ),
    )


def recuperacion(*, enlace: str, expira_horas: int = 2) -> str:
    return envoltura(
        titulo="Restablezca su contraseña",
        cuerpo=(
            parrafo("Recibimos una solicitud para restablecer la contraseña de su cuenta.")
            + boton(texto="Elegir nueva contraseña", enlace=enlace)
            + parrafo(
                f"El enlace es válido por {expira_horas} horas. Si usted no solicitó "
                "este cambio, ignore el mensaje: su contraseña seguirá siendo la misma."
            )
            + enlace_crudo(enlace)
        ),
    )


def password_restablecido() -> str:
    return envoltura(
        titulo="Su contraseña fue actualizada",
        cuerpo=(
            parrafo("La contraseña de su cuenta se cambió correctamente.")
            + nota_manuscrita(
                "Si no reconoce este cambio, escriba de inmediato a "
                "contacto@illimanitravel.bo para asegurar su cuenta."
            )
        ),
    )


def ficha_viajero_abierta(*, nombre_completo: str, numero_documento: str | None) -> str:
    """Aviso al viajero cuando el personal abre su ficha en el panel."""
    documento = (
        f" con el documento {numero_documento}" if numero_documento else ""
    )
    return envoltura(
        titulo="Su ficha de viajero quedó registrada",
        cuerpo=(
            parrafo(
                f"Abrimos la ficha de <strong>{nombre_completo}</strong>{documento} "
                "en el archivo de la agencia."
            )
            + parrafo(
                "La usaremos para preparar su cotización, reservar sus servicios y "
                "tener a mano sus documentos de viaje."
            )
        ),
    )
