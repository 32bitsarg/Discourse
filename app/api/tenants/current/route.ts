import { NextRequest, NextResponse } from 'next/server'
import { getCurrentTenant, getSubscriptionPlan } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant()

    if (!tenant) {
      return NextResponse.json(
        { message: 'Tenant no encontrado' },
        { status: 404 }
      )
    }

    // Obtener información del plan
    const plan = await getSubscriptionPlan(tenant.plan_id)

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        custom_domain: tenant.custom_domain,
        status: tenant.status,
        settings: tenant.settings,
      },
      plan: plan ? {
        name: plan.name,
        display_name: plan.display_name,
        features: plan.features,
      } : null,
    })
  } catch (error: any) {
    console.error('Error getting current tenant:', error)
    return NextResponse.json(
      { message: 'Error al obtener el tenant' },
      { status: 500 }
    )
  }
}

