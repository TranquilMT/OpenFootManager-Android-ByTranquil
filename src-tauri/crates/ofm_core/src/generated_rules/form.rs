pub fn modifier(form: u8) -> i8 {
    ((form.min(100) as i16 - 50) / 17).clamp(-3, 3) as i8
}
